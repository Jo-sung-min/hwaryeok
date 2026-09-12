package com.hwaryeok.product;

import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsSessionCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.MetadataDirective;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Component
public class S3ProductImageStorage {

    static final String IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
    static final String PENDING_CACHE_CONTROL = "private, no-store";
    static final String META_PRODUCT_ID = "product-id";
    static final String META_UPLOAD_EXPIRES_AT = "upload-expires-at";
    static final String META_DECLARED_SIZE = "declared-size";

    private static final long DEFAULT_PRESIGNED_URL_SECONDS = 300;
    private static final long MIN_PRESIGNED_URL_SECONDS = 60;
    private static final long MAX_PRESIGNED_URL_SECONDS = 900;
    private static final Duration COMPLETION_GRACE = Duration.ofMinutes(5);
    private static final String RANGE_FOR_MAGIC_BYTES = "bytes=0-11";

    private static final Pattern BUCKET_NAME = Pattern.compile("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$");
    private static final Pattern REGION_NAME = Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)+$");
    private static final Pattern PRODUCT_ID = Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");
    private static final Pattern OBJECT_TOKEN = Pattern.compile("^[A-Za-z0-9_-]+$");
    private static final Pattern PRESIGNED_FILE = Pattern.compile(
            "^([0-9]{10,})-([0-9]+)-([A-Za-z0-9_-]+)\\.(png|jpg|webp)$"
    );
    private static final Set<String> ALLOWED_SIGNED_HEADERS = Set.of(
            "host",
            "content-length",
            "content-type",
            "cache-control",
            "if-none-match",
            "x-amz-meta-" + META_PRODUCT_ID,
            "x-amz-meta-" + META_UPLOAD_EXPIRES_AT,
            "x-amz-meta-" + META_DECLARED_SIZE
    );

    private final Settings settings;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final Supplier<String> uniqueValueSupplier;
    private final Clock clock;
    private final Duration presignedUrlDuration;
    private final boolean ownsClients;

    @Autowired
    public S3ProductImageStorage(
            @Value("${app.storage.s3.bucket:}") String bucket,
            @Value("${app.storage.s3.key-prefix:}") String keyPrefix,
            @Value("${app.storage.s3.public-base-url:}") String publicBaseUrl,
            @Value("${app.storage.s3.region:}") String region,
            @Value("${app.storage.s3.access-key-id:}") String accessKeyId,
            @Value("${app.storage.s3.secret-access-key:}") String secretAccessKey,
            @Value("${app.storage.s3.session-token:}") String sessionToken,
            @Value("${app.storage.s3.presigned-url-seconds:300}") long presignedUrlSeconds
    ) {
        this(
                Settings.from(bucket, keyPrefix, publicBaseUrl, region, accessKeyId, secretAccessKey, sessionToken),
                null,
                null,
                () -> UUID.randomUUID().toString(),
                Clock.systemUTC(),
                duration(presignedUrlSeconds),
                true,
                true
        );
    }

    S3ProductImageStorage(
            String bucket,
            String keyPrefix,
            String publicBaseUrl,
            String region,
            S3Client s3Client,
            Supplier<String> uniqueValueSupplier
    ) {
        this(bucket, keyPrefix, publicBaseUrl, region, "", "", "", s3Client, uniqueValueSupplier);
    }

    S3ProductImageStorage(
            String bucket,
            String keyPrefix,
            String publicBaseUrl,
            String region,
            String accessKeyId,
            String secretAccessKey,
            String sessionToken,
            S3Client s3Client,
            Supplier<String> uniqueValueSupplier
    ) {
        this(
                Settings.from(bucket, keyPrefix, publicBaseUrl, region, accessKeyId, secretAccessKey, sessionToken),
                s3Client,
                null,
                uniqueValueSupplier,
                Clock.systemUTC(),
                duration(DEFAULT_PRESIGNED_URL_SECONDS),
                false,
                false
        );
    }

    S3ProductImageStorage(
            String bucket,
            String keyPrefix,
            String publicBaseUrl,
            String region,
            S3Client s3Client,
            S3Presigner s3Presigner,
            Supplier<String> uniqueValueSupplier,
            Clock clock,
            Duration presignedUrlDuration
    ) {
        this(bucket, keyPrefix, publicBaseUrl, region, s3Client, s3Presigner,
                uniqueValueSupplier, clock, presignedUrlDuration, false);
    }

    S3ProductImageStorage(
            String bucket,
            String keyPrefix,
            String publicBaseUrl,
            String region,
            S3Client s3Client,
            S3Presigner s3Presigner,
            Supplier<String> uniqueValueSupplier,
            Clock clock,
            Duration presignedUrlDuration,
            boolean ownsClients
    ) {
        this(
                Settings.from(bucket, keyPrefix, publicBaseUrl, region, "", "", ""),
                s3Client,
                s3Presigner,
                uniqueValueSupplier,
                clock,
                validateDuration(presignedUrlDuration),
                false,
                ownsClients
        );
    }

    private S3ProductImageStorage(
            Settings settings,
            S3Client suppliedClient,
            S3Presigner suppliedPresigner,
            Supplier<String> uniqueValueSupplier,
            Clock clock,
            Duration presignedUrlDuration,
            boolean createClients,
            boolean ownsClients
    ) {
        this.settings = settings;
        this.uniqueValueSupplier = Objects.requireNonNull(uniqueValueSupplier, "고유 객체 키 생성기가 필요합니다.");
        this.clock = Objects.requireNonNull(clock, "업로드 시각 기준이 필요합니다.");
        this.presignedUrlDuration = Objects.requireNonNull(presignedUrlDuration, "Presigned URL 유효 시간이 필요합니다.");
        this.ownsClients = settings.enabled() && ownsClients;

        if (!settings.enabled()) {
            this.s3Client = null;
            this.s3Presigner = null;
        } else if (createClients) {
            var clientBuilder = S3Client.builder().region(settings.region());
            var presignerBuilder = S3Presigner.builder()
                    .region(settings.region())
                    .serviceConfiguration(browserPresignerConfiguration());
            if (settings.credentialsProvider() != null) {
                clientBuilder.credentialsProvider(settings.credentialsProvider());
                presignerBuilder.credentialsProvider(settings.credentialsProvider());
            }
            this.s3Client = clientBuilder.build();
            this.s3Presigner = presignerBuilder.build();
        } else {
            this.s3Client = Objects.requireNonNull(suppliedClient, "S3Client가 필요합니다.");
            this.s3Presigner = suppliedPresigner;
        }
    }

    public boolean isEnabled() {
        return settings.enabled();
    }

    /** Legacy server-proxied upload. New clients should use the presigned URL flow. */
    public String upload(String productId, byte[] data, String contentType) {
        requireEnabled();
        validateProductId(productId);
        Objects.requireNonNull(data, "업로드할 이미지 데이터가 필요합니다.");
        if (data.length == 0) throw new IllegalArgumentException("업로드할 이미지 데이터가 비어 있습니다.");

        String extension = ProductImageValidation.extensionFor(contentType);
        String uniqueValue = requireSafeUniqueValue();
        String relativePath = "products/" + productId + "/" + uniqueValue + "." + extension;
        String objectKey = settings.keyPrefix() + "/" + relativePath;
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(settings.bucket())
                .key(objectKey)
                .contentType(contentType)
                .contentLength((long) data.length)
                .cacheControl(IMMUTABLE_CACHE_CONTROL)
                .build();
        try {
            s3Client.putObject(request, RequestBody.fromBytes(data));
        } catch (SdkException exception) {
            throw new IllegalStateException("S3에 제품 이미지를 저장하지 못했습니다.", exception);
        }
        return publicUrl(relativePath);
    }

    public ProductImageUploadUrlResponse createUploadUrl(String productId, String contentType, long size) {
        requireEnabled();
        requirePresigner();
        validateProductId(productId);
        if (size <= 0 || size > ProductImageValidation.MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("제품 이미지는 5MB 이하만 등록할 수 있어요.");
        }
        String normalizedContentType = ProductImageValidation.normalizeContentType(contentType);
        String extension = ProductImageValidation.extensionFor(normalizedContentType);
        String uniqueValue = requireSafeUniqueValue();
        Instant expiresAt = clock.instant().plus(presignedUrlDuration).truncatedTo(ChronoUnit.SECONDS);
        String expiresEpoch = Long.toString(expiresAt.getEpochSecond());
        String declaredSize = Long.toString(size);
        String pendingRelativePath = "pending/product-images/" + productId + "/"
                + expiresEpoch + "-" + declaredSize + "-" + uniqueValue + "." + extension;
        String publishedRelativePath = "products/" + productId + "/" + uniqueValue + "." + extension;
        String objectKey = settings.keyPrefix() + "/" + pendingRelativePath;

        Map<String, String> metadata = Map.of(
                META_PRODUCT_ID, productId,
                META_UPLOAD_EXPIRES_AT, expiresEpoch,
                META_DECLARED_SIZE, declaredSize
        );
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(settings.bucket())
                .key(objectKey)
                .contentType(normalizedContentType)
                .contentLength(size)
                .cacheControl(PENDING_CACHE_CONTROL)
                .ifNoneMatch("*")
                .metadata(metadata)
                .build();
        PresignedPutObjectRequest presigned;
        try {
            presigned = s3Presigner.presignPutObject(PutObjectPresignRequest.builder()
                    .signatureDuration(presignedUrlDuration)
                    .putObjectRequest(putRequest)
                    .build());
        } catch (SdkException exception) {
            throw new IllegalStateException("이미지 업로드 URL을 생성하지 못했습니다.", exception);
        }

        validateSignedHeaders(presigned.signedHeaders(), putRequest);
        Map<String, String> browserHeaders = new LinkedHashMap<>();
        browserHeaders.put("Content-Type", normalizedContentType);
        browserHeaders.put("Cache-Control", PENDING_CACHE_CONTROL);
        browserHeaders.put("If-None-Match", "*");
        browserHeaders.put("x-amz-meta-" + META_PRODUCT_ID, productId);
        browserHeaders.put("x-amz-meta-" + META_UPLOAD_EXPIRES_AT, expiresEpoch);
        browserHeaders.put("x-amz-meta-" + META_DECLARED_SIZE, declaredSize);
        return new ProductImageUploadUrlResponse(
                presigned.url().toString(), objectKey, publicUrl(publishedRelativePath),
                Map.copyOf(browserHeaders), expiresAt
        );
    }

    public String confirmUpload(String productId, String objectKey) {
        requireEnabled();
        validateProductId(productId);
        UploadIntent intent = parseAndValidateIntent(productId, objectKey);

        HeadObjectResponse pendingHead = headIfPresent(objectKey);
        if (pendingHead == null) {
            // The response may have been lost after a previous successful completion and cleanup.
            // Verifying the deterministic published key makes completion safely idempotent.
            HeadObjectResponse publishedHead = headIfPresent(intent.publishedObjectKey());
            if (publishedHead == null) {
                throw new IllegalArgumentException("업로드된 제품 이미지를 찾을 수 없어요.");
            }
            validateHead(intent, publishedHead, IMMUTABLE_CACHE_CONTROL);
            verifyMagicBytes(intent, intent.publishedObjectKey());
            return publicUrl(intent.publishedRelativePath());
        }

        validateHead(intent, pendingHead, PENDING_CACHE_CONTROL);
        verifyMagicBytes(intent, objectKey);
        copyToPublished(intent, objectKey, pendingHead.eTag());
        return publicUrl(intent.publishedRelativePath());
    }

    @PreDestroy
    void closeClients() {
        if (!ownsClients) return;
        if (s3Presigner != null) s3Presigner.close();
        if (s3Client != null) s3Client.close();
    }

    private UploadIntent parseAndValidateIntent(String productId, String objectKey) {
        if (!StringUtils.hasText(objectKey) || objectKey.length() > 1024) throw invalidObjectKey();
        String relativePrefix = "pending/product-images/" + productId + "/";
        String expectedPrefix = settings.keyPrefix() + "/" + relativePrefix;
        if (!objectKey.startsWith(expectedPrefix)) throw invalidObjectKey();

        String fileName = objectKey.substring(expectedPrefix.length());
        if (fileName.isBlank() || fileName.indexOf('/') >= 0 || fileName.indexOf('\\') >= 0) {
            throw invalidObjectKey();
        }
        Matcher matcher = PRESIGNED_FILE.matcher(fileName);
        if (!matcher.matches()) throw invalidObjectKey();

        long expiresEpoch;
        long declaredSize;
        try {
            expiresEpoch = Long.parseLong(matcher.group(1));
            declaredSize = Long.parseLong(matcher.group(2));
        } catch (NumberFormatException exception) {
            throw invalidObjectKey();
        }
        if (declaredSize <= 0 || declaredSize > ProductImageValidation.MAX_IMAGE_BYTES) {
            throw invalidObjectKey();
        }
        if (!OBJECT_TOKEN.matcher(matcher.group(3)).matches()) throw invalidObjectKey();

        Instant expiresAt;
        try {
            expiresAt = Instant.ofEpochSecond(expiresEpoch);
        } catch (RuntimeException exception) {
            throw invalidObjectKey();
        }
        Instant now = clock.instant();
        if (expiresAt.isAfter(now.plus(presignedUrlDuration))) {
            throw invalidObjectKey();
        }
        if (!now.isBefore(expiresAt.plus(COMPLETION_GRACE))) {
            throw new IllegalArgumentException("이미지 업로드 확인 시간이 만료되었어요. 다시 업로드해 주세요.");
        }

        String extension = matcher.group(4);
        String publishedRelativePath = "products/" + productId + "/" + matcher.group(3) + "." + extension;
        return new UploadIntent(
                relativePrefix + fileName,
                settings.keyPrefix() + "/" + publishedRelativePath,
                publishedRelativePath,
                ProductImageValidation.contentTypeForExtension(extension),
                declaredSize,
                expiresEpoch,
                productId
        );
    }

    private HeadObjectResponse headIfPresent(String objectKey) {
        try {
            return s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(settings.bucket()).key(objectKey).build());
        } catch (S3Exception exception) {
            if (exception.statusCode() == 404) return null;
            throw new IllegalStateException("S3 제품 이미지를 확인하지 못했습니다.", exception);
        } catch (SdkException exception) {
            throw new IllegalStateException("S3 제품 이미지를 확인하지 못했습니다.", exception);
        }
    }

    private void copyToPublished(UploadIntent intent, String pendingObjectKey, String sourceETag) {
        Map<String, String> metadata = Map.of(
                META_PRODUCT_ID, intent.productId(),
                META_UPLOAD_EXPIRES_AT, Long.toString(intent.expiresEpoch()),
                META_DECLARED_SIZE, Long.toString(intent.declaredSize())
        );
        var builder = CopyObjectRequest.builder()
                .sourceBucket(settings.bucket())
                .sourceKey(pendingObjectKey)
                .destinationBucket(settings.bucket())
                .destinationKey(intent.publishedObjectKey())
                .contentType(intent.contentType())
                .cacheControl(IMMUTABLE_CACHE_CONTROL)
                .metadata(metadata)
                .metadataDirective(MetadataDirective.REPLACE);
        if (StringUtils.hasText(sourceETag)) builder.copySourceIfMatch(sourceETag);
        try {
            s3Client.copyObject(builder.build());
        } catch (SdkException exception) {
            throw new IllegalStateException("S3 제품 이미지를 공개 경로로 확정하지 못했습니다.", exception);
        }
    }

    private void validateHead(UploadIntent intent, HeadObjectResponse head, String expectedCacheControl) {
        if (!Objects.equals(head.contentLength(), intent.declaredSize())) {
            throw invalidUploadedObject("이미지 크기가 발급한 업로드 정보와 다릅니다.");
        }
        if (!intent.contentType().equalsIgnoreCase(Objects.toString(head.contentType(), ""))) {
            throw invalidUploadedObject("이미지 형식이 발급한 업로드 정보와 다릅니다.");
        }
        if (!expectedCacheControl.equals(head.cacheControl())) {
            throw invalidUploadedObject("이미지 캐시 정보가 발급한 업로드 정보와 다릅니다.");
        }
        Map<String, String> metadata = head.metadata();
        if (metadata == null
                || !intent.productId().equals(metadata.get(META_PRODUCT_ID))
                || !Long.toString(intent.expiresEpoch()).equals(metadata.get(META_UPLOAD_EXPIRES_AT))
                || !Long.toString(intent.declaredSize()).equals(metadata.get(META_DECLARED_SIZE))) {
            throw invalidUploadedObject("이미지 업로드 소유 정보가 일치하지 않습니다.");
        }
    }

    private void verifyMagicBytes(UploadIntent intent, String objectKey) {
        ResponseBytes<GetObjectResponse> prefix;
        try {
            prefix = s3Client.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(settings.bucket()).key(objectKey).range(RANGE_FOR_MAGIC_BYTES).build());
        } catch (SdkException exception) {
            throw new IllegalStateException("S3 제품 이미지 내용을 확인하지 못했습니다.", exception);
        }
        String detected = ProductImageValidation.detectContentType(prefix.asByteArray());
        if (!intent.contentType().equals(detected)) {
            throw invalidUploadedObject("이미지의 실제 파일 형식이 Content-Type과 다릅니다.");
        }
    }

    private void validateSignedHeaders(Map<String, List<String>> signedHeaders, PutObjectRequest request) {
        Map<String, String> normalized = new LinkedHashMap<>();
        signedHeaders.forEach((name, values) -> {
            if (values == null || values.size() != 1) {
                throw new IllegalStateException("S3 업로드 URL의 서명 헤더를 확인할 수 없습니다.");
            }
            normalized.put(name.toLowerCase(Locale.ROOT), values.getFirst());
        });
        if (!ALLOWED_SIGNED_HEADERS.containsAll(normalized.keySet())
                || normalized.keySet().stream().anyMatch(name -> name.contains("checksum") || name.equals("content-md5"))) {
            throw new IllegalStateException("브라우저가 보낼 수 없는 S3 업로드 헤더가 서명에 포함되었습니다.");
        }
        requireSignedHeader(normalized, "content-type", request.contentType());
        requireSignedHeader(normalized, "content-length", Long.toString(request.contentLength()));
        requireSignedHeader(normalized, "cache-control", request.cacheControl());
        requireSignedHeader(normalized, "if-none-match", "*");
        request.metadata().forEach((name, value) ->
                requireSignedHeader(normalized, "x-amz-meta-" + name, value));
    }

    private void requireSignedHeader(Map<String, String> signedHeaders, String name, String expectedValue) {
        if (!expectedValue.equals(signedHeaders.get(name))) {
            throw new IllegalStateException("S3 업로드 URL에 필수 서명 헤더가 누락되었습니다: " + name);
        }
    }

    private String publicUrl(String relativePath) {
        return settings.publicBaseUrl() + "/" + relativePath;
    }

    private void requireEnabled() {
        if (!settings.enabled()) {
            throw new IllegalStateException("S3 제품 이미지 저장이 설정되지 않았습니다.");
        }
    }

    private void requirePresigner() {
        if (s3Presigner == null) {
            throw new IllegalStateException("S3 Presigned URL 생성기가 설정되지 않았습니다.");
        }
    }

    private void validateProductId(String productId) {
        if (!StringUtils.hasText(productId) || !PRODUCT_ID.matcher(productId).matches()) {
            throw new IllegalArgumentException("S3 객체 경로에 사용할 수 없는 제품 ID입니다.");
        }
    }

    private String requireSafeUniqueValue() {
        String uniqueValue = uniqueValueSupplier.get();
        if (!StringUtils.hasText(uniqueValue) || !OBJECT_TOKEN.matcher(uniqueValue).matches()) {
            throw new IllegalStateException("안전한 S3 객체 키를 생성하지 못했습니다.");
        }
        return uniqueValue;
    }

    private IllegalArgumentException invalidObjectKey() {
        return new IllegalArgumentException("이 제품용으로 발급된 업로드 경로가 아닙니다.");
    }

    private IllegalArgumentException invalidUploadedObject(String detail) {
        return new IllegalArgumentException("업로드된 제품 이미지를 확인할 수 없어요. " + detail);
    }

    private static Duration duration(long seconds) {
        if (seconds < MIN_PRESIGNED_URL_SECONDS || seconds > MAX_PRESIGNED_URL_SECONDS) {
            throw new IllegalStateException("S3_PRESIGNED_URL_SECONDS는 60초 이상 900초 이하로 지정해 주세요.");
        }
        return Duration.ofSeconds(seconds);
    }

    private static Duration validateDuration(Duration value) {
        Objects.requireNonNull(value, "Presigned URL 유효 시간이 필요합니다.");
        if (value.compareTo(Duration.ofSeconds(MIN_PRESIGNED_URL_SECONDS)) < 0
                || value.compareTo(Duration.ofSeconds(MAX_PRESIGNED_URL_SECONDS)) > 0) {
            throw new IllegalStateException("Presigned URL 유효 시간은 60초 이상 900초 이하여야 합니다.");
        }
        return value;
    }

    @SuppressWarnings("deprecation")
    private static S3Configuration browserPresignerConfiguration() {
        return S3Configuration.builder().checksumValidationEnabled(false).build();
    }

    private record UploadIntent(
            String relativePath,
            String publishedObjectKey,
            String publishedRelativePath,
            String contentType,
            long declaredSize,
            long expiresEpoch,
            String productId
    ) {
    }

    private record Settings(
            boolean enabled,
            String bucket,
            String keyPrefix,
            String publicBaseUrl,
            Region region,
            AwsCredentialsProvider credentialsProvider
    ) {
        private static Settings from(String bucketValue, String keyPrefixValue,
                                     String publicBaseUrlValue, String regionValue,
                                     String accessKeyIdValue, String secretAccessKeyValue,
                                     String sessionTokenValue) {
            String bucket = normalize(bucketValue);
            String keyPrefix = normalize(keyPrefixValue);
            String publicBaseUrl = normalize(publicBaseUrlValue);
            String region = normalize(regionValue);
            String accessKeyId = normalize(accessKeyIdValue);
            String secretAccessKey = normalize(secretAccessKeyValue);
            String sessionToken = normalize(sessionTokenValue);
            if (bucket.isEmpty() && keyPrefix.isEmpty() && publicBaseUrl.isEmpty()) {
                return new Settings(false, "", "", "", null, null);
            }

            List<String> missing = new ArrayList<>();
            if (bucket.isEmpty()) missing.add("S3_BUCKET");
            if (keyPrefix.isEmpty()) missing.add("S3_KEY_PREFIX");
            if (publicBaseUrl.isEmpty()) missing.add("S3_PUBLIC_BASE_URL");
            if (region.isEmpty()) missing.add("AWS_REGION");
            if (!missing.isEmpty()) {
                throw new IllegalStateException("S3 이미지 저장 설정이 일부만 지정되었습니다. 누락: "
                        + String.join(", ", missing) + ". 네 값을 모두 지정하거나 모두 비워 주세요.");
            }

            AwsCredentialsProvider credentialsProvider = credentialsProvider(accessKeyId, secretAccessKey, sessionToken);
            validateBucket(bucket);
            String normalizedKeyPrefix = normalizeKeyPrefix(keyPrefix);
            String normalizedPublicBaseUrl = normalizePublicBaseUrl(publicBaseUrl);
            if (!REGION_NAME.matcher(region).matches()) {
                throw new IllegalStateException("AWS_REGION은 ap-northeast-2 같은 AWS 리전 이름이어야 합니다.");
            }
            return new Settings(true, bucket, normalizedKeyPrefix, normalizedPublicBaseUrl,
                    Region.of(region), credentialsProvider);
        }

        private static String normalize(String value) {
            return value == null ? "" : value.strip();
        }

        private static AwsCredentialsProvider credentialsProvider(
                String accessKeyId,
                String secretAccessKey,
                String sessionToken
        ) {
            if (accessKeyId.isEmpty() && secretAccessKey.isEmpty() && sessionToken.isEmpty()) return null;
            if (accessKeyId.isEmpty() || secretAccessKey.isEmpty()) {
                throw new IllegalStateException("AWS_ACCESS_KEY_ID와 AWS_SECRET_ACCESS_KEY는 함께 지정해야 하며, "
                        + "AWS_SESSION_TOKEN은 두 값과 함께 사용해야 합니다.");
            }
            if (sessionToken.isEmpty()) {
                return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId, secretAccessKey));
            }
            return StaticCredentialsProvider.create(
                    AwsSessionCredentials.create(accessKeyId, secretAccessKey, sessionToken)
            );
        }

        private static void validateBucket(String bucket) {
            boolean invalid = !BUCKET_NAME.matcher(bucket).matches()
                    || bucket.contains("..")
                    || bucket.contains(".-")
                    || bucket.contains("-.")
                    || bucket.matches("^\\d{1,3}(?:\\.\\d{1,3}){3}$");
            if (invalid) {
                throw new IllegalStateException("S3_BUCKET은 URL이나 경로가 아닌 순수 버킷명이어야 합니다.");
            }
        }

        private static String normalizeKeyPrefix(String keyPrefix) {
            String normalized = keyPrefix.replaceAll("^/+|/+$", "");
            if (normalized.isEmpty() || normalized.contains("\\") || normalized.contains("//")) {
                throw new IllegalStateException("S3_KEY_PREFIX는 hwaryeok 같은 S3 객체 경로여야 합니다.");
            }
            for (String segment : normalized.split("/")) {
                if (segment.isBlank() || ".".equals(segment) || "..".equals(segment)) {
                    throw new IllegalStateException("S3_KEY_PREFIX에 비어 있거나 상대적인 경로 조각을 사용할 수 없습니다.");
                }
            }
            return normalized;
        }

        private static String normalizePublicBaseUrl(String publicBaseUrl) {
            URI uri;
            try {
                uri = URI.create(publicBaseUrl);
            } catch (IllegalArgumentException exception) {
                throw new IllegalStateException("S3_PUBLIC_BASE_URL은 올바른 공개 URL이어야 합니다.", exception);
            }
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if (!("https".equals(scheme) || "http".equals(scheme))
                    || !StringUtils.hasText(uri.getHost())
                    || uri.getUserInfo() != null
                    || uri.getQuery() != null
                    || uri.getFragment() != null) {
                throw new IllegalStateException("S3_PUBLIC_BASE_URL은 쿼리 없는 http(s) 공개 URL이어야 합니다.");
            }
            return publicBaseUrl.replaceAll("/+$", "");
        }
    }
}

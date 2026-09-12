package com.hwaryeok.product;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsSessionCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * Idempotently copies the tracked legacy product assets to
 * {@code S3_KEY_PREFIX/products/<filename>}.
 *
 * <p>The command is a dry run unless {@code --apply} is supplied. It never
 * deletes local files, S3 objects, or database rows.</p>
 */
public final class LegacyProductImageS3Migration {

    private static final String CACHE_CONTROL = "public, max-age=31536000, immutable";
    private static final Pattern SAFE_FILE_NAME = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9._-]*\\.(?:jpg|png|webp)$");

    private LegacyProductImageS3Migration() {
    }

    public static void main(String[] args) throws IOException {
        Options options = Options.parse(args);
        Map<String, String> dotenv = loadDotenv();
        Settings settings = Settings.from(dotenv);
        List<Path> images = findImages(options.source());

        int uploaded = 0;
        int skipped = 0;
        int planned = 0;

        try (S3Client s3 = S3Client.builder()
                .region(Region.of(settings.region()))
                .credentialsProvider(settings.credentialsProvider())
                .build()) {
            for (Path image : images) {
                String fileName = image.getFileName().toString();
                String key = settings.keyPrefix() + "/products/" + fileName;
                byte[] sha256 = digest(image, "SHA-256");
                long size = Files.size(image);
                String contentType = contentType(fileName);

                HeadObjectResponse current = headIfPresent(s3, settings.bucket(), key);
                boolean unchanged = current != null
                        && current.contentLength() == size
                        && contentType.equalsIgnoreCase(current.contentType())
                        && CACHE_CONTROL.equalsIgnoreCase(current.cacheControl());
                if (unchanged) {
                    skipped++;
                    System.out.printf("SKIP     s3://%s/%s (%d bytes)%n", settings.bucket(), key, size);
                    continue;
                }
                if (!options.apply()) {
                    planned++;
                    System.out.printf("PLAN     s3://%s/%s (%d bytes, sha256=%s)%n",
                            settings.bucket(), key, size, HexFormat.of().formatHex(sha256));
                    continue;
                }

                PutObjectRequest request = PutObjectRequest.builder()
                        .bucket(settings.bucket())
                        .key(key)
                        .contentType(contentType)
                        .contentLength(size)
                        .cacheControl(CACHE_CONTROL)
                        .checksumSHA256(Base64.getEncoder().encodeToString(sha256))
                        .build();
                s3.putObject(request, RequestBody.fromFile(image));

                HeadObjectResponse uploadedObject = headIfPresent(s3, settings.bucket(), key);
                if (uploadedObject == null || uploadedObject.contentLength() != size) {
                    throw new IllegalStateException("업로드 검증에 실패했습니다: s3://" + settings.bucket() + "/" + key);
                }
                uploaded++;
                System.out.printf("UPLOADED s3://%s/%s (%d bytes)%n", settings.bucket(), key, size);
            }
        }

        System.out.printf("SUMMARY total=%d uploaded=%d skipped=%d planned=%d mode=%s%n",
                images.size(), uploaded, skipped, planned, options.apply() ? "APPLY" : "DRY_RUN");
    }

    private static List<Path> findImages(Path source) throws IOException {
        Path normalized = source.toAbsolutePath().normalize();
        if (!Files.isDirectory(normalized)) {
            throw new IllegalArgumentException("제품 이미지 폴더를 찾을 수 없습니다: " + normalized);
        }
        try (var stream = Files.list(normalized)) {
            List<Path> images = stream
                    .filter(Files::isRegularFile)
                    .filter(path -> SAFE_FILE_NAME.matcher(path.getFileName().toString()).matches())
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .toList();
            if (images.isEmpty()) throw new IllegalArgumentException("이관할 제품 이미지가 없습니다: " + normalized);
            return images;
        }
    }

    private static HeadObjectResponse headIfPresent(S3Client s3, String bucket, String key) {
        try {
            return s3.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (S3Exception exception) {
            if (exception.statusCode() == 404) return null;
            throw exception;
        }
    }

    private static String contentType(String fileName) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private static byte[] digest(Path path, String algorithm) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance(algorithm);
            try (var input = Files.newInputStream(path)) {
                byte[] buffer = new byte[16 * 1024];
                int read;
                while ((read = input.read(buffer)) >= 0) {
                    digest.update(buffer, 0, read);
                }
            }
            return digest.digest();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(algorithm + " 해시를 사용할 수 없습니다.", exception);
        }
    }

    private static Map<String, String> loadDotenv() throws IOException {
        Path dotenvPath = List.of(Path.of(".env"), Path.of("..", ".env")).stream()
                .filter(Files::isRegularFile)
                .findFirst()
                .orElse(null);
        if (dotenvPath == null) return Map.of();

        Map<String, String> values = new HashMap<>();
        for (String rawLine : Files.readAllLines(dotenvPath, StandardCharsets.UTF_8)) {
            String line = rawLine.strip();
            if (line.isEmpty() || line.startsWith("#")) continue;
            int separator = line.indexOf('=');
            if (separator <= 0) continue;
            String key = line.substring(0, separator).strip();
            String value = unquote(line.substring(separator + 1).strip());
            values.putIfAbsent(key, value);
        }
        return values;
    }

    private static String unquote(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }

    private record Options(Path source, boolean apply) {
        private static Options parse(String[] args) {
            Path source = Path.of("..", "frontend", "public", "products");
            boolean apply = false;
            for (String arg : args) {
                if ("--apply".equals(arg)) {
                    apply = true;
                } else if (arg.startsWith("--source=")) {
                    source = Path.of(arg.substring("--source=".length()));
                } else {
                    throw new IllegalArgumentException("알 수 없는 인수입니다: " + arg);
                }
            }
            return new Options(source, apply);
        }
    }

    private record Settings(
            String bucket,
            String keyPrefix,
            String region,
            AwsCredentialsProvider credentialsProvider
    ) {
        private static Settings from(Map<String, String> dotenv) {
            String bucket = required("S3_BUCKET", dotenv);
            String keyPrefix = required("S3_KEY_PREFIX", dotenv).replaceAll("^/+|/+$", "");
            String region = required("AWS_REGION", dotenv);
            if (keyPrefix.isBlank() || keyPrefix.contains("\\") || keyPrefix.contains("..")) {
                throw new IllegalArgumentException("S3_KEY_PREFIX가 안전하지 않습니다.");
            }

            String accessKey = value("AWS_ACCESS_KEY_ID", dotenv);
            String secretKey = value("AWS_SECRET_ACCESS_KEY", dotenv);
            String sessionToken = value("AWS_SESSION_TOKEN", dotenv);
            AwsCredentialsProvider credentialsProvider;
            if (accessKey.isBlank() && secretKey.isBlank() && sessionToken.isBlank()) {
                credentialsProvider = DefaultCredentialsProvider.create();
            } else if (accessKey.isBlank() || secretKey.isBlank()) {
                throw new IllegalArgumentException("AWS_ACCESS_KEY_ID와 AWS_SECRET_ACCESS_KEY를 함께 설정해야 합니다.");
            } else if (sessionToken.isBlank()) {
                credentialsProvider = StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
            } else {
                credentialsProvider = StaticCredentialsProvider.create(
                        AwsSessionCredentials.create(accessKey, secretKey, sessionToken));
            }
            return new Settings(bucket, keyPrefix, region, credentialsProvider);
        }

        private static String required(String name, Map<String, String> dotenv) {
            String value = value(name, dotenv);
            if (value.isBlank()) throw new IllegalArgumentException(name + " 환경 변수가 필요합니다.");
            return value;
        }

        private static String value(String name, Map<String, String> dotenv) {
            String processValue = System.getenv(name);
            return processValue == null || processValue.isBlank() ? dotenv.getOrDefault(name, "").strip() : processValue.strip();
        }
    }
}

package com.hwaryeok.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

class S3ProductImageStorageTest {

    private static final Instant NOW = Instant.parse("2026-09-11T00:00:00Z");
    private static final Duration FIVE_MINUTES = Duration.ofMinutes(5);
    private static final byte[] PNG = png(2, 2);

    @Test
    void uploadsToPrefixedS3KeyButKeepsPrefixOutOfPublicCdnUrl() throws IOException {
        S3Client s3Client = mock(S3Client.class);
        S3ProductImageStorage storage = new S3ProductImageStorage(
                "fatell-aws-s3",
                "/hwaryeok/",
                "https://cdn.hwaryeok.co.kr/",
                "ap-northeast-2",
                s3Client,
                () -> "fixed-object-id"
        );
        byte[] image = new byte[] {1, 2, 3, 4};

        String publicUrl = storage.upload("birch-cream", image, "image/png");

        ArgumentCaptor<PutObjectRequest> requestCaptor = ArgumentCaptor.forClass(PutObjectRequest.class);
        ArgumentCaptor<RequestBody> bodyCaptor = ArgumentCaptor.forClass(RequestBody.class);
        verify(s3Client).putObject(requestCaptor.capture(), bodyCaptor.capture());
        PutObjectRequest request = requestCaptor.getValue();
        assertThat(request.bucket()).isEqualTo("fatell-aws-s3");
        assertThat(request.key()).isEqualTo("hwaryeok/products/birch-cream/fixed-object-id.png");
        assertThat(request.contentType()).isEqualTo("image/png");
        assertThat(request.contentLength()).isEqualTo(image.length);
        assertThat(request.cacheControl()).isEqualTo(S3ProductImageStorage.IMMUTABLE_CACHE_CONTROL);
        assertThat(bodyCaptor.getValue().contentStreamProvider().newStream().readAllBytes()).isEqualTo(image);
        assertThat(publicUrl).isEqualTo("https://cdn.hwaryeok.co.kr/products/birch-cream/fixed-object-id.png");
    }

    @Test
    void remainsDisabledWhenEveryS3SettingIsEmpty() {
        S3ProductImageStorage storage = new S3ProductImageStorage(
                "", "", "", "", null, () -> "unused"
        );

        assertThat(storage.isEnabled()).isFalse();
        assertThatThrownBy(() -> storage.upload("birch-cream", new byte[] {1}, "image/png"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("설정되지 않았습니다");
    }

    @Test
    void remainsDisabledWhenOnlyGlobalAwsEnvironmentValuesExist() {
        S3ProductImageStorage storage = new S3ProductImageStorage(
                "", "", "", "ap-northeast-2",
                "access-without-secret", "", "session-without-keys",
                null, () -> "unused"
        );

        assertThat(storage.isEnabled()).isFalse();
    }

    @Test
    void rejectsPartiallyConfiguredS3AtStartup() {
        assertThatThrownBy(() -> new S3ProductImageStorage(
                "fatell-aws-s3", "hwaryeok", "", "", mock(S3Client.class), () -> "unused"
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("S3_PUBLIC_BASE_URL")
                .hasMessageContaining("AWS_REGION")
                .hasMessageContaining("모두 지정하거나 모두 비워");
    }

    @Test
    void rejectsBucketHostOrPathInsteadOfTreatingItAsBucketName() {
        assertThatThrownBy(() -> new S3ProductImageStorage(
                "fatell-aws-s3.s3.amazonaws.com/hwaryeok",
                "hwaryeok",
                "https://cdn.hwaryeok.co.kr",
                "ap-northeast-2",
                mock(S3Client.class),
                () -> "unused"
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("순수 버킷명");
    }

    @Test
    void rejectsIncompleteStaticCredentialsLoadedThroughSpring() {
        assertThatThrownBy(() -> new S3ProductImageStorage(
                "fatell-aws-s3",
                "hwaryeok",
                "https://cdn.hwaryeok.co.kr",
                "ap-northeast-2",
                "access-only",
                "",
                "",
                mock(S3Client.class),
                () -> "unused"
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AWS_ACCESS_KEY_ID")
                .hasMessageContaining("AWS_SECRET_ACCESS_KEY");

        assertThatThrownBy(() -> new S3ProductImageStorage(
                "fatell-aws-s3",
                "hwaryeok",
                "https://cdn.hwaryeok.co.kr",
                "ap-northeast-2",
                "",
                "",
                "session-only",
                mock(S3Client.class),
                () -> "unused"
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AWS_SESSION_TOKEN");
    }

    @Test
    void wrapsAwsUploadFailureWithoutReturningAUrl() {
        S3Client s3Client = mock(S3Client.class);
        when(s3Client.putObject(
                org.mockito.ArgumentMatchers.any(PutObjectRequest.class),
                org.mockito.ArgumentMatchers.any(RequestBody.class)
        )).thenThrow(SdkClientException.create("network unavailable"));
        S3ProductImageStorage storage = new S3ProductImageStorage(
                "fatell-aws-s3", "hwaryeok", "https://cdn.hwaryeok.co.kr", "ap-northeast-2",
                s3Client, () -> "fixed-object-id"
        );

        assertThatThrownBy(() -> storage.upload("birch-cream", new byte[] {1}, "image/webp"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("S3에 제품 이미지를 저장하지 못했습니다.")
                .hasCauseInstanceOf(SdkClientException.class);
    }

    @Test
    void createsSingleUsePresignedPutBoundToProductTypeSizeAndFiveMinuteExpiry() throws Exception {
        S3Client s3Client = mock(S3Client.class);
        S3Presigner presigner = mock(S3Presigner.class);
        PresignedPutObjectRequest presigned = mock(PresignedPutObjectRequest.class);
        long expiresEpoch = NOW.plus(FIVE_MINUTES).getEpochSecond();
        when(presigned.url()).thenReturn(URI.create("https://fatell-aws-s3.s3.ap-northeast-2.amazonaws.com/signed").toURL());
        when(presigned.signedHeaders()).thenReturn(signedHeaders("birch-cream", PNG.length, expiresEpoch));
        when(presigner.presignPutObject(org.mockito.ArgumentMatchers.any(PutObjectPresignRequest.class)))
                .thenReturn(presigned);
        S3ProductImageStorage storage = storage(s3Client, presigner, NOW);

        ProductImageUploadUrlResponse response = storage.createUploadUrl("birch-cream", "image/png", PNG.length);

        ArgumentCaptor<PutObjectPresignRequest> presignCaptor = ArgumentCaptor.forClass(PutObjectPresignRequest.class);
        verify(presigner).presignPutObject(presignCaptor.capture());
        PutObjectPresignRequest presignRequest = presignCaptor.getValue();
        PutObjectRequest put = presignRequest.putObjectRequest();
        assertThat(presignRequest.signatureDuration()).isEqualTo(FIVE_MINUTES);
        assertThat(put.bucket()).isEqualTo("fatell-aws-s3");
        assertThat(put.key()).isEqualTo("hwaryeok/pending/product-images/birch-cream/"
                + expiresEpoch + "-" + PNG.length + "-fixed-object-id.png");
        assertThat(put.contentType()).isEqualTo("image/png");
        assertThat(put.contentLength()).isEqualTo(PNG.length);
        assertThat(put.cacheControl()).isEqualTo(S3ProductImageStorage.PENDING_CACHE_CONTROL);
        assertThat(put.ifNoneMatch()).isEqualTo("*");
        assertThat(put.metadata()).containsExactlyInAnyOrderEntriesOf(Map.of(
                S3ProductImageStorage.META_PRODUCT_ID, "birch-cream",
                S3ProductImageStorage.META_UPLOAD_EXPIRES_AT, Long.toString(expiresEpoch),
                S3ProductImageStorage.META_DECLARED_SIZE, Integer.toString(PNG.length)
        ));
        assertThat(response.objectKey()).isEqualTo(put.key());
        assertThat(response.imageUrl()).isEqualTo(
                "https://cdn.hwaryeok.co.kr/products/birch-cream/fixed-object-id.png"
        );
        assertThat(response.expiresAt()).isEqualTo(NOW.plus(FIVE_MINUTES));
        assertThat(response.headers())
                .containsEntry("Content-Type", "image/png")
                .containsEntry("Cache-Control", S3ProductImageStorage.PENDING_CACHE_CONTROL)
                .containsEntry("If-None-Match", "*")
                .containsEntry("x-amz-meta-declared-size", Integer.toString(PNG.length))
                .doesNotContainKeys("Content-Length", "Host");
        verifyNoInteractions(s3Client);
    }

    @Test
    void profileUploadTicketAndCompletionStayBoundToTheAuthenticatedUser() throws Exception {
        String userId = "72f525cb-d18e-4cf5-a3d3-ea05a4ed4197";
        long expiresEpoch = NOW.plus(FIVE_MINUTES).getEpochSecond();
        S3Client s3Client = mock(S3Client.class);
        S3Presigner presigner = mock(S3Presigner.class);
        PresignedPutObjectRequest presigned = mock(PresignedPutObjectRequest.class);
        when(presigned.url()).thenReturn(URI.create("https://fatell-aws-s3.s3.ap-northeast-2.amazonaws.com/profile-signed").toURL());
        when(presigned.signedHeaders()).thenReturn(signedProfileHeaders(userId, PNG.length, expiresEpoch));
        when(presigner.presignPutObject(org.mockito.ArgumentMatchers.any(PutObjectPresignRequest.class)))
                .thenReturn(presigned);
        S3ProductImageStorage storage = storage(s3Client, presigner, NOW);

        ProductImageUploadUrlResponse ticket = storage.createProfileUploadUrl(
                userId, "avatar.png", "image/png", PNG.length
        );
        String expectedPendingKey = "hwaryeok/pending/profile-images/" + userId + "/"
                + expiresEpoch + "-" + PNG.length + "-fixed-object-id.png";
        assertThat(ticket.objectKey()).isEqualTo(expectedPendingKey);
        assertThat(ticket.imageUrl()).isEqualTo(
                "https://cdn.hwaryeok.co.kr/profiles/" + userId + "/fixed-object-id.png"
        );
        assertThat(ticket.headers()).containsEntry("x-amz-meta-profile-user-id", userId);

        String publishedKey = "hwaryeok/profiles/" + userId + "/fixed-object-id.png";
        when(s3Client.headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(publishedKey)
        ))).thenThrow(missingObject());
        when(s3Client.headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(expectedPendingKey)
        ))).thenReturn(validProfileHead(userId, expiresEpoch, PNG.length, "image/png"));
        when(s3Client.getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), PNG));

        assertThat(storage.confirmProfileUpload(userId, ticket.objectKey())).isEqualTo(ticket.imageUrl());
        ArgumentCaptor<PutObjectRequest> published = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(published.capture(), org.mockito.ArgumentMatchers.any(RequestBody.class));
        assertThat(published.getValue().key())
                .isEqualTo("hwaryeok/profiles/" + userId + "/fixed-object-id.png");
        assertThat(published.getValue().metadata())
                .containsEntry(S3ProductImageStorage.META_PROFILE_USER_ID, userId)
                .containsKey(S3ProductImageStorage.META_STORED_SIZE);
        assertThat(published.getValue().cacheControl()).isEqualTo(S3ProductImageStorage.PROFILE_CACHE_CONTROL);
        assertThat(published.getValue().ifNoneMatch()).isEqualTo("*");

        assertThatThrownBy(() -> storage.confirmProfileUpload(
                "7e63d468-c128-4ae8-94c3-0d003db8acfb", ticket.objectKey()
        )).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("이 회원용");
    }

    @Test
    void profileImagesRequireACompleteDecodablePngOrJpegWithinDimensionLimits() {
        String userId = "72f525cb-d18e-4cf5-a3d3-ea05a4ed4197";
        long expiresEpoch = NOW.plus(FIVE_MINUTES).getEpochSecond();
        S3Client s3Client = mock(S3Client.class);
        S3ProductImageStorage storage = storage(s3Client, mock(S3Presigner.class), NOW);

        byte[] truncated = new byte[] {
                (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4
        };
        String truncatedKey = profileObjectKey(userId, expiresEpoch, truncated.length, "png");
        String publishedKey = "hwaryeok/profiles/" + userId + "/fixed-object-id.png";
        when(s3Client.headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(publishedKey)
        ))).thenThrow(missingObject());
        when(s3Client.headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(truncatedKey)
        ))).thenReturn(validProfileHead(userId, expiresEpoch, truncated.length, "image/png"));
        when(s3Client.getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), truncated));

        assertThatThrownBy(() -> storage.confirmProfileUpload(userId, truncatedKey))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("손상되지 않은");
        verify(s3Client, never()).putObject(
                org.mockito.ArgumentMatchers.any(PutObjectRequest.class),
                org.mockito.ArgumentMatchers.any(RequestBody.class)
        );

        byte[] oversized = png(S3ProductImageStorage.PROFILE_MAX_WIDTH + 1, 1);
        String oversizedKey = profileObjectKey(userId, expiresEpoch, oversized.length, "png");
        when(s3Client.headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(oversizedKey)
        ))).thenReturn(validProfileHead(userId, expiresEpoch, oversized.length, "image/png"));
        when(s3Client.getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), oversized));

        assertThatThrownBy(() -> storage.confirmProfileUpload(userId, oversizedKey))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("2,048px");
    }

    @Test
    void repeatedProfileCompletionUsesThePublishedHeadFastPath() {
        String userId = "72f525cb-d18e-4cf5-a3d3-ea05a4ed4197";
        long expiresEpoch = NOW.plus(FIVE_MINUTES).getEpochSecond();
        String pendingKey = profileObjectKey(userId, expiresEpoch, PNG.length, "png");
        String publishedKey = "hwaryeok/profiles/" + userId + "/fixed-object-id.png";
        S3Client s3Client = mock(S3Client.class);
        S3ProductImageStorage storage = storage(s3Client, mock(S3Presigner.class), NOW);
        AtomicReference<PutObjectRequest> published = new AtomicReference<>();
        when(s3Client.headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(publishedKey)
        ))).thenAnswer(ignored -> {
            PutObjectRequest request = published.get();
            if (request == null) throw missingObject();
            return validPublishedProfileHead(
                    userId, expiresEpoch, PNG.length, request.contentLength(), "image/png"
            );
        });
        when(s3Client.headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(pendingKey)
        ))).thenReturn(validProfileHead(userId, expiresEpoch, PNG.length, "image/png"));
        when(s3Client.getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), PNG));
        when(s3Client.putObject(
                org.mockito.ArgumentMatchers.any(PutObjectRequest.class),
                org.mockito.ArgumentMatchers.any(RequestBody.class)
        )).thenAnswer(invocation -> {
            published.set(invocation.getArgument(0, PutObjectRequest.class));
            return null;
        });

        String first = storage.confirmProfileUpload(userId, pendingKey);
        String retry = storage.confirmProfileUpload(userId, pendingKey);

        assertThat(retry).isEqualTo(first);
        verify(s3Client, times(1)).getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class));
        verify(s3Client, times(1)).putObject(
                org.mockito.ArgumentMatchers.any(PutObjectRequest.class),
                org.mockito.ArgumentMatchers.any(RequestBody.class)
        );
        verify(s3Client, times(1)).headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(pendingKey)
        ));
        verify(s3Client, times(2)).headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(publishedKey)
        ));
    }

    @Test
    void concurrentProfilePublishConflictFinishesWithHeadValidationOnly() {
        String userId = "72f525cb-d18e-4cf5-a3d3-ea05a4ed4197";
        long expiresEpoch = NOW.plus(FIVE_MINUTES).getEpochSecond();
        String pendingKey = profileObjectKey(userId, expiresEpoch, PNG.length, "png");
        String publishedKey = "hwaryeok/profiles/" + userId + "/fixed-object-id.png";
        S3Client s3Client = mock(S3Client.class);
        S3ProductImageStorage storage = storage(s3Client, mock(S3Presigner.class), NOW);
        AtomicReference<PutObjectRequest> attempted = new AtomicReference<>();
        when(s3Client.headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(publishedKey)
        ))).thenAnswer(ignored -> {
            PutObjectRequest request = attempted.get();
            if (request == null) throw missingObject();
            return validPublishedProfileHead(
                    userId, expiresEpoch, PNG.length, request.contentLength(), "image/png"
            );
        });
        when(s3Client.headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(pendingKey)
        ))).thenReturn(validProfileHead(userId, expiresEpoch, PNG.length, "image/png"));
        when(s3Client.getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), PNG));
        when(s3Client.putObject(
                org.mockito.ArgumentMatchers.any(PutObjectRequest.class),
                org.mockito.ArgumentMatchers.any(RequestBody.class)
        )).thenAnswer(invocation -> {
            attempted.set(invocation.getArgument(0, PutObjectRequest.class));
            throw S3Exception.builder().statusCode(412).message("already published").build();
        });

        assertThat(storage.confirmProfileUpload(userId, pendingKey))
                .isEqualTo("https://cdn.hwaryeok.co.kr/profiles/" + userId + "/fixed-object-id.png");
        verify(s3Client, times(1)).getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class));
        verify(s3Client, times(2)).headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(publishedKey)
        ));
    }

    @Test
    void profileTicketsRejectWebpWithoutChangingProductWebpSupport() {
        S3ProductImageStorage storage = storage(mock(S3Client.class), mock(S3Presigner.class), NOW);
        String userId = "72f525cb-d18e-4cf5-a3d3-ea05a4ed4197";

        assertThatThrownBy(() -> storage.createProfileUploadUrl(userId, "avatar.webp", "image/webp", 128))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("PNG", "JPG");
    }

    @Test
    void deletesOnlyAnOwnerBoundPublishedProfileObject() {
        String userId = "72f525cb-d18e-4cf5-a3d3-ea05a4ed4197";
        S3Client s3Client = mock(S3Client.class);
        S3ProductImageStorage storage = storage(s3Client, mock(S3Presigner.class), NOW);
        String imageUrl = "https://cdn.hwaryeok.co.kr/profiles/" + userId + "/fixed-object-id.png";
        when(s3Client.headObject(org.mockito.ArgumentMatchers.any(HeadObjectRequest.class)))
                .thenReturn(HeadObjectResponse.builder()
                        .metadata(Map.of(S3ProductImageStorage.META_PROFILE_USER_ID, userId))
                        .build());

        storage.deleteProfileImage(userId, imageUrl);

        ArgumentCaptor<DeleteObjectRequest> deleted = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client).deleteObject(deleted.capture());
        assertThat(deleted.getValue().key()).isEqualTo("hwaryeok/profiles/" + userId + "/fixed-object-id.png");

        assertThatThrownBy(() -> storage.deleteProfileImage(
                userId, "https://cdn.hwaryeok.co.kr/profiles/another-user/fixed-object-id.png"
        )).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("소유");
        assertThatThrownBy(() -> storage.deleteProfileImage(
                userId, imageUrl + "?attacker=1"
        )).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("소유");

        when(s3Client.headObject(org.mockito.ArgumentMatchers.any(HeadObjectRequest.class)))
                .thenReturn(HeadObjectResponse.builder()
                        .metadata(Map.of(S3ProductImageStorage.META_PROFILE_USER_ID, "another-user"))
                        .build());
        assertThatThrownBy(() -> storage.deleteProfileImage(userId, imageUrl))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("객체");
    }

    @Test
    @SuppressWarnings("deprecation")
    void actualAwsPresignerRequiresOnlyBrowserSettableOrAutomaticHeadersAndNoChecksum() {
        S3Client s3Client = mock(S3Client.class);
        AtomicReference<PresignedPutObjectRequest> generated = new AtomicReference<>();
        try (S3Presigner actualPresigner = S3Presigner.builder()
                .region(Region.AP_NORTHEAST_2)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create("test-access-key", "test-secret-key")
                ))
                .serviceConfiguration(S3Configuration.builder().checksumValidationEnabled(false).build())
                .build()) {
            S3Presigner forwardingPresigner = mock(S3Presigner.class);
            when(forwardingPresigner.presignPutObject(org.mockito.ArgumentMatchers.any(PutObjectPresignRequest.class)))
                    .thenAnswer(invocation -> {
                        PutObjectPresignRequest input = invocation.getArgument(0, PutObjectPresignRequest.class);
                        PresignedPutObjectRequest request = actualPresigner.presignPutObject(input);
                        generated.set(request);
                        return request;
                    });
            S3ProductImageStorage storage = storage(s3Client, forwardingPresigner, NOW);

            ProductImageUploadUrlResponse response = storage.createUploadUrl("birch-cream", "image/png", PNG.length);

            Map<String, List<String>> signedHeaders = generated.get().signedHeaders();
            assertThat(signedHeaders.keySet()).allMatch(name -> !name.toLowerCase().contains("checksum"));
            assertThat(signedHeaders).containsKeys(
                    "host", "content-type", "content-length", "cache-control", "if-none-match",
                    "x-amz-meta-product-id", "x-amz-meta-upload-expires-at", "x-amz-meta-declared-size"
            );
            // AWS defines browser-executable as requiring only Host. A direct fetch PUT remains browser-safe
            // because the returned headers are settable and Content-Length is supplied automatically by Fetch.
            assertThat(generated.get().isBrowserExecutable()).isFalse();
            assertThat(response.headers()).doesNotContainKeys("Host", "Content-Length");
        }
    }

    @Test
    void confirmsUploadedObjectWithHeadAndRangeMagicCheckBeforeReturningCdnUrl() {
        S3Client s3Client = mock(S3Client.class);
        S3ProductImageStorage storage = storage(s3Client, mock(S3Presigner.class), NOW);
        long expiresEpoch = NOW.plus(FIVE_MINUTES).getEpochSecond();
        String key = objectKey("birch-cream", expiresEpoch, PNG.length, "png");
        when(s3Client.headObject(org.mockito.ArgumentMatchers.any(HeadObjectRequest.class)))
                .thenReturn(validPendingHead("birch-cream", expiresEpoch, PNG.length, "image/png"));
        when(s3Client.getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), PNG));

        String imageUrl = storage.confirmUpload("birch-cream", key);

        assertThat(imageUrl).isEqualTo("https://cdn.hwaryeok.co.kr/products/birch-cream/fixed-object-id.png");
        ArgumentCaptor<HeadObjectRequest> headCaptor = ArgumentCaptor.forClass(HeadObjectRequest.class);
        ArgumentCaptor<GetObjectRequest> getCaptor = ArgumentCaptor.forClass(GetObjectRequest.class);
        ArgumentCaptor<CopyObjectRequest> copyCaptor = ArgumentCaptor.forClass(CopyObjectRequest.class);
        verify(s3Client).headObject(headCaptor.capture());
        verify(s3Client).getObjectAsBytes(getCaptor.capture());
        verify(s3Client).copyObject(copyCaptor.capture());
        assertThat(headCaptor.getValue().bucket()).isEqualTo("fatell-aws-s3");
        assertThat(headCaptor.getValue().key()).isEqualTo(key);
        assertThat(getCaptor.getValue().range()).isEqualTo("bytes=0-11");
        assertThat(copyCaptor.getValue().sourceKey()).isEqualTo(key);
        assertThat(copyCaptor.getValue().destinationKey())
                .isEqualTo("hwaryeok/products/birch-cream/fixed-object-id.png");
        assertThat(copyCaptor.getValue().copySourceIfMatch()).isEqualTo("fixed-etag");
    }

    @Test
    void rejectsAnotherProductsKeyAndExpiredKeyBeforeCallingS3() {
        S3Client s3Client = mock(S3Client.class);
        S3ProductImageStorage storage = storage(s3Client, mock(S3Presigner.class), NOW);

        assertThatThrownBy(() -> storage.confirmUpload(
                "birch-cream", objectKey("bean-essence", NOW.plus(FIVE_MINUTES).getEpochSecond(), PNG.length, "png")
        )).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("이 제품용");
        assertThatThrownBy(() -> storage.confirmUpload(
                "birch-cream", objectKey(
                        "birch-cream", NOW.minus(FIVE_MINUTES).getEpochSecond(), PNG.length, "png"
                )
        )).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("만료");

        verifyNoInteractions(s3Client);
    }

    @Test
    void rejectsHeadMetadataOrMagicMismatch() {
        S3Client s3Client = mock(S3Client.class);
        S3ProductImageStorage storage = storage(s3Client, mock(S3Presigner.class), NOW);
        long expiresEpoch = NOW.plus(FIVE_MINUTES).getEpochSecond();
        String key = objectKey("birch-cream", expiresEpoch, PNG.length, "png");
        when(s3Client.headObject(org.mockito.ArgumentMatchers.any(HeadObjectRequest.class)))
                .thenReturn(validPendingHead("birch-cream", expiresEpoch, PNG.length + 1L, "image/png"));

        assertThatThrownBy(() -> storage.confirmUpload("birch-cream", key))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("크기");
        verify(s3Client, never()).getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class));

        when(s3Client.headObject(org.mockito.ArgumentMatchers.any(HeadObjectRequest.class)))
                .thenReturn(validPendingHead("birch-cream", expiresEpoch, PNG.length, "image/png"));
        byte[] jpegPrefix = new byte[] {(byte) 0xff, (byte) 0xd8, (byte) 0xff};
        when(s3Client.getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), jpegPrefix));

        assertThatThrownBy(() -> storage.confirmUpload("birch-cream", key))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("실제 파일 형식");
    }

    @Test
    void requiresPrivateNoStoreForPendingAndPublicImmutableForPublishedObjects() {
        long expiresEpoch = NOW.plus(FIVE_MINUTES).getEpochSecond();
        String pendingKey = objectKey("birch-cream", expiresEpoch, PNG.length, "png");

        S3Client pendingClient = mock(S3Client.class);
        S3ProductImageStorage pendingStorage = storage(pendingClient, mock(S3Presigner.class), NOW);
        when(pendingClient.headObject(org.mockito.ArgumentMatchers.any(HeadObjectRequest.class)))
                .thenReturn(validPublishedHead("birch-cream", expiresEpoch, PNG.length, "image/png"));

        assertThatThrownBy(() -> pendingStorage.confirmUpload("birch-cream", pendingKey))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("캐시 정보");
        verify(pendingClient, never()).copyObject(org.mockito.ArgumentMatchers.any(CopyObjectRequest.class));

        S3Client publishedClient = mock(S3Client.class);
        S3ProductImageStorage publishedStorage = storage(publishedClient, mock(S3Presigner.class), NOW);
        String publishedKey = "hwaryeok/products/birch-cream/fixed-object-id.png";
        S3Exception missing = (S3Exception) S3Exception.builder().statusCode(404).message("not found").build();
        when(publishedClient.headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(pendingKey)
        ))).thenThrow(missing);
        when(publishedClient.headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request != null && request.key().equals(publishedKey)
        ))).thenReturn(validPendingHead("birch-cream", expiresEpoch, PNG.length, "image/png"));

        assertThatThrownBy(() -> publishedStorage.confirmUpload("birch-cream", pendingKey))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("캐시 정보");
        verify(publishedClient, never()).getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class));
    }

    @Test
    void completionRetryKeepsPendingObjectAndCopiesToTheSameDeterministicPublishedKey() {
        S3Client s3Client = mock(S3Client.class);
        S3ProductImageStorage storage = storage(s3Client, mock(S3Presigner.class), NOW);
        long expiresEpoch = NOW.plus(FIVE_MINUTES).getEpochSecond();
        String pendingKey = objectKey("birch-cream", expiresEpoch, PNG.length, "png");
        when(s3Client.headObject(org.mockito.ArgumentMatchers.any(HeadObjectRequest.class)))
                .thenReturn(validPendingHead("birch-cream", expiresEpoch, PNG.length, "image/png"));
        when(s3Client.getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), PNG));

        String firstImageUrl = storage.confirmUpload("birch-cream", pendingKey);
        String retryImageUrl = storage.confirmUpload("birch-cream", pendingKey);

        assertThat(firstImageUrl).isEqualTo("https://cdn.hwaryeok.co.kr/products/birch-cream/fixed-object-id.png");
        assertThat(retryImageUrl).isEqualTo(firstImageUrl);
        ArgumentCaptor<CopyObjectRequest> copies = ArgumentCaptor.forClass(CopyObjectRequest.class);
        verify(s3Client, times(2)).copyObject(copies.capture());
        assertThat(copies.getAllValues())
                .extracting(CopyObjectRequest::sourceKey)
                .containsOnly(pendingKey);
        assertThat(copies.getAllValues())
                .extracting(CopyObjectRequest::destinationKey)
                .containsOnly("hwaryeok/products/birch-cream/fixed-object-id.png");
        verify(s3Client, times(2)).headObject(org.mockito.ArgumentMatchers.any(HeadObjectRequest.class));
        verify(s3Client, times(2)).getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class));
    }

    @Test
    void headForbiddenIsNeverMistakenForADeletedPendingObject() {
        S3Client s3Client = mock(S3Client.class);
        S3ProductImageStorage storage = storage(s3Client, mock(S3Presigner.class), NOW);
        long expiresEpoch = NOW.plus(FIVE_MINUTES).getEpochSecond();
        String pendingKey = objectKey("birch-cream", expiresEpoch, PNG.length, "png");
        S3Exception forbidden = (S3Exception) S3Exception.builder().statusCode(403).message("forbidden").build();
        when(s3Client.headObject(org.mockito.ArgumentMatchers.any(HeadObjectRequest.class))).thenThrow(forbidden);

        assertThatThrownBy(() -> storage.confirmUpload("birch-cream", pendingKey))
                .isInstanceOf(IllegalStateException.class)
                .hasCause(forbidden);

        verify(s3Client).headObject(org.mockito.ArgumentMatchers.argThat(
                (HeadObjectRequest request) -> request.key().equals(pendingKey)
        ));
        verify(s3Client, never()).getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class));
    }

    @Test
    void copyFailureIsReportedBeforeAUrlCanBeCommitted() {
        S3Client s3Client = mock(S3Client.class);
        S3ProductImageStorage storage = storage(s3Client, mock(S3Presigner.class), NOW);
        long expiresEpoch = NOW.plus(FIVE_MINUTES).getEpochSecond();
        String key = objectKey("birch-cream", expiresEpoch, PNG.length, "png");
        when(s3Client.headObject(org.mockito.ArgumentMatchers.any(HeadObjectRequest.class)))
                .thenReturn(validPendingHead("birch-cream", expiresEpoch, PNG.length, "image/png"));
        when(s3Client.getObjectAsBytes(org.mockito.ArgumentMatchers.any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), PNG));
        when(s3Client.copyObject(org.mockito.ArgumentMatchers.any(CopyObjectRequest.class)))
                .thenThrow(SdkClientException.create("copy unavailable"));

        assertThatThrownBy(() -> storage.confirmUpload("birch-cream", key))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("공개 경로로 확정");
    }

    @Test
    void closesOwnedPresignerAndS3ClientOnceApplicationStops() {
        S3Client s3Client = mock(S3Client.class);
        S3Presigner presigner = mock(S3Presigner.class);
        S3ProductImageStorage storage = new S3ProductImageStorage(
                "fatell-aws-s3", "hwaryeok", "https://cdn.hwaryeok.co.kr", "ap-northeast-2",
                s3Client, presigner, () -> "fixed-object-id", Clock.fixed(NOW, ZoneOffset.UTC), FIVE_MINUTES, true
        );

        storage.closeClients();

        verify(presigner).close();
        verify(s3Client).close();
    }

    private S3ProductImageStorage storage(S3Client client, S3Presigner presigner, Instant now) {
        return new S3ProductImageStorage(
                "fatell-aws-s3", "hwaryeok", "https://cdn.hwaryeok.co.kr", "ap-northeast-2",
                client, presigner, () -> "fixed-object-id", Clock.fixed(now, ZoneOffset.UTC), FIVE_MINUTES
        );
    }

    private String objectKey(String productId, long expiresEpoch, long size, String extension) {
        return "hwaryeok/pending/product-images/" + productId + "/" + expiresEpoch + "-" + size
                + "-fixed-object-id." + extension;
    }

    private String profileObjectKey(String userId, long expiresEpoch, long size, String extension) {
        return "hwaryeok/pending/profile-images/" + userId + "/" + expiresEpoch + "-" + size
                + "-fixed-object-id." + extension;
    }

    private static byte[] png(int width, int height) {
        try {
            BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
            try (var output = new ByteArrayOutputStream()) {
                if (!ImageIO.write(image, "png", output)) throw new AssertionError("PNG writer unavailable");
                return output.toByteArray();
            }
        } catch (IOException exception) {
            throw new AssertionError(exception);
        }
    }

    private HeadObjectResponse validPendingHead(
            String productId,
            long expiresEpoch,
            long size,
            String contentType
    ) {
        return validHead(productId, expiresEpoch, size, contentType, S3ProductImageStorage.PENDING_CACHE_CONTROL);
    }

    private HeadObjectResponse validPublishedHead(
            String productId,
            long expiresEpoch,
            long size,
            String contentType
    ) {
        return validHead(productId, expiresEpoch, size, contentType, S3ProductImageStorage.IMMUTABLE_CACHE_CONTROL);
    }

    private HeadObjectResponse validProfileHead(
            String userId,
            long expiresEpoch,
            long size,
            String contentType
    ) {
        return HeadObjectResponse.builder()
                .contentLength(size)
                .contentType(contentType)
                .cacheControl(S3ProductImageStorage.PENDING_CACHE_CONTROL)
                .eTag("fixed-etag")
                .metadata(Map.of(
                        S3ProductImageStorage.META_PROFILE_USER_ID, userId,
                        S3ProductImageStorage.META_UPLOAD_EXPIRES_AT, Long.toString(expiresEpoch),
                        S3ProductImageStorage.META_DECLARED_SIZE, Long.toString(size)
                ))
                .build();
    }

    private HeadObjectResponse validPublishedProfileHead(
            String userId,
            long expiresEpoch,
            long declaredSize,
            long storedSize,
            String contentType
    ) {
        return HeadObjectResponse.builder()
                .contentLength(storedSize)
                .contentType(contentType)
                .cacheControl(S3ProductImageStorage.PROFILE_CACHE_CONTROL)
                .eTag("published-etag")
                .metadata(Map.of(
                        S3ProductImageStorage.META_PROFILE_USER_ID, userId,
                        S3ProductImageStorage.META_UPLOAD_EXPIRES_AT, Long.toString(expiresEpoch),
                        S3ProductImageStorage.META_DECLARED_SIZE, Long.toString(declaredSize),
                        S3ProductImageStorage.META_STORED_SIZE, Long.toString(storedSize)
                ))
                .build();
    }

    private S3Exception missingObject() {
        return (S3Exception) S3Exception.builder().statusCode(404).message("not found").build();
    }

    private HeadObjectResponse validHead(
            String productId,
            long expiresEpoch,
            long size,
            String contentType,
            String cacheControl
    ) {
        return HeadObjectResponse.builder()
                .contentLength(size)
                .contentType(contentType)
                .cacheControl(cacheControl)
                .eTag("fixed-etag")
                .metadata(Map.of(
                        S3ProductImageStorage.META_PRODUCT_ID, productId,
                        S3ProductImageStorage.META_UPLOAD_EXPIRES_AT, Long.toString(expiresEpoch),
                        S3ProductImageStorage.META_DECLARED_SIZE, Long.toString(size)
                ))
                .build();
    }

    private Map<String, List<String>> signedHeaders(String productId, long size, long expiresEpoch) {
        return Map.of(
                "host", List.of("fatell-aws-s3.s3.ap-northeast-2.amazonaws.com"),
                "content-type", List.of("image/png"),
                "content-length", List.of(Long.toString(size)),
                "cache-control", List.of(S3ProductImageStorage.PENDING_CACHE_CONTROL),
                "if-none-match", List.of("*"),
                "x-amz-meta-product-id", List.of(productId),
                "x-amz-meta-upload-expires-at", List.of(Long.toString(expiresEpoch)),
                "x-amz-meta-declared-size", List.of(Long.toString(size))
        );
    }


    private Map<String, List<String>> signedProfileHeaders(String userId, long size, long expiresEpoch) {
        return Map.of(
                "host", List.of("fatell-aws-s3.s3.ap-northeast-2.amazonaws.com"),
                "content-type", List.of("image/png"),
                "content-length", List.of(Long.toString(size)),
                "cache-control", List.of(S3ProductImageStorage.PENDING_CACHE_CONTROL),
                "if-none-match", List.of("*"),
                "x-amz-meta-profile-user-id", List.of(userId),
                "x-amz-meta-upload-expires-at", List.of(Long.toString(expiresEpoch)),
                "x-amz-meta-declared-size", List.of(Long.toString(size))
        );
    }
}

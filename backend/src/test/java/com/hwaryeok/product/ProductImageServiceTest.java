package com.hwaryeok.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class ProductImageServiceTest {

    private static final byte[] PNG = new byte[] {
            (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3
    };

    @Test
    void configuredS3StoresObjectAndReturnsCdnUrlWithoutWritingImageBytesToDatabase() {
        ProductService productService = mock(ProductService.class);
        ProductImageRepository imageRepository = mock(ProductImageRepository.class);
        S3ProductImageStorage s3Storage = mock(S3ProductImageStorage.class);
        Product product = product();
        when(productService.getAdminProduct("birch-cream")).thenReturn(product);
        when(s3Storage.isEnabled()).thenReturn(true);
        when(s3Storage.upload(
                eq("birch-cream"),
                argThat(data -> java.util.Arrays.equals(data, PNG)),
                eq("image/png")
        )).thenReturn("https://cdn.hwaryeok.co.kr/products/birch-cream/object.png");
        ProductImageService service = new ProductImageService(productService, imageRepository, s3Storage);

        ProductResponse response = service.upload(
                "birch-cream",
                new MockMultipartFile("file", "birch.png", "image/png", PNG)
        );

        assertThat(response.imageUrl()).isEqualTo("https://cdn.hwaryeok.co.kr/products/birch-cream/object.png");
        verify(imageRepository, never()).save(any(ProductImage.class));
        verify(imageRepository, never()).findById(any());
    }

    @Test
    void emptyS3ConfigurationKeepsExistingDatabaseAndMediaUrlFallback() {
        ProductService productService = mock(ProductService.class);
        ProductImageRepository imageRepository = mock(ProductImageRepository.class);
        S3ProductImageStorage s3Storage = mock(S3ProductImageStorage.class);
        Product product = product();
        when(productService.getAdminProduct("birch-cream")).thenReturn(product);
        when(s3Storage.isEnabled()).thenReturn(false);
        when(imageRepository.findById("birch-cream")).thenReturn(Optional.empty());
        ProductImageService service = new ProductImageService(productService, imageRepository, s3Storage);

        ProductResponse response = service.upload(
                "birch-cream",
                new MockMultipartFile("file", "birch.png", "image/png", PNG)
        );

        assertThat(response.imageUrl()).isEqualTo("/api/v1/media/products/birch-cream");
        verify(imageRepository).save(argThat(image ->
                image.getProductId().equals("birch-cream")
                        && image.getContentType().equals("image/png")
                        && java.util.Arrays.equals(image.getImageData(), PNG)
        ));
    }

    @Test
    void s3FailureDoesNotChangeExistingUrlOrSilentlyWriteDatabaseFallback() {
        ProductService productService = mock(ProductService.class);
        ProductImageRepository imageRepository = mock(ProductImageRepository.class);
        S3ProductImageStorage s3Storage = mock(S3ProductImageStorage.class);
        Product product = new Product(
                "birch-cream", "테스트 브랜드", "자작나무 크림", "크림", 82,
                "보습", "진정", 24000, "sage", null, "/products/original.jpg"
        );
        when(productService.getAdminProduct("birch-cream")).thenReturn(product);
        when(s3Storage.isEnabled()).thenReturn(true);
        when(s3Storage.upload(eq("birch-cream"), any(byte[].class), eq("image/png")))
                .thenThrow(new IllegalStateException("S3에 제품 이미지를 저장하지 못했습니다."));
        ProductImageService service = new ProductImageService(productService, imageRepository, s3Storage);

        assertThatThrownBy(() -> service.upload(
                "birch-cream",
                new MockMultipartFile("file", "birch.png", "image/png", PNG)
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("S3에 제품 이미지를 저장하지 못했습니다.");
        assertThat(product.getImageUrl()).isEqualTo("/products/original.jpg");
        verifyNoInteractions(imageRepository);
    }

    @Test
    void createsPresignedUploadOnlyAfterProductAndMetadataValidation() {
        ProductService productService = mock(ProductService.class);
        ProductImageRepository imageRepository = mock(ProductImageRepository.class);
        S3ProductImageStorage s3Storage = mock(S3ProductImageStorage.class);
        when(productService.getAdminProduct("birch-cream")).thenReturn(product());
        ProductImageUploadUrlResponse expected = new ProductImageUploadUrlResponse(
                "https://s3.example/signed", "hwaryeok/products/birch-cream/key.png",
                "https://cdn.hwaryeok.co.kr/products/birch-cream/key.png",
                Map.of("Content-Type", "image/png"), Instant.parse("2026-09-11T00:05:00Z")
        );
        when(s3Storage.createUploadUrl("birch-cream", "image/png", PNG.length)).thenReturn(expected);
        ProductImageService service = new ProductImageService(productService, imageRepository, s3Storage);

        ProductImageUploadUrlResponse response = service.createUploadUrl(
                "birch-cream", new ProductImageUploadUrlRequest("birch.png", "image/png", PNG.length)
        );

        assertThat(response).isEqualTo(expected);
        verify(s3Storage).createUploadUrl("birch-cream", "image/png", PNG.length);
        verifyNoInteractions(imageRepository);
    }

    @Test
    void refusesMismatchedExtensionUnsupportedTypeAndOversizedPresignedMetadata() {
        ProductService productService = mock(ProductService.class);
        ProductImageRepository imageRepository = mock(ProductImageRepository.class);
        S3ProductImageStorage s3Storage = mock(S3ProductImageStorage.class);
        when(productService.getAdminProduct("birch-cream")).thenReturn(product());
        ProductImageService service = new ProductImageService(productService, imageRepository, s3Storage);

        assertThatThrownBy(() -> service.createUploadUrl(
                "birch-cream", new ProductImageUploadUrlRequest("birch.jpg", "image/png", PNG.length)
        )).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("확장자");
        assertThatThrownBy(() -> service.createUploadUrl(
                "birch-cream", new ProductImageUploadUrlRequest("birch.gif", "image/gif", PNG.length)
        )).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("PNG, JPG, WEBP");
        assertThatThrownBy(() -> service.createUploadUrl(
                "birch-cream", new ProductImageUploadUrlRequest(
                        "birch.png", "image/png", ProductImageValidation.MAX_IMAGE_BYTES + 1
                )
        )).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("5MB");

        verify(s3Storage, never()).createUploadUrl(any(), any(), org.mockito.ArgumentMatchers.anyLong());
        verifyNoInteractions(imageRepository);
    }

    @Test
    void completionUpdatesProductOnlyAfterS3VerificationSucceeds() {
        ProductService productService = mock(ProductService.class);
        ProductImageRepository imageRepository = mock(ProductImageRepository.class);
        S3ProductImageStorage s3Storage = mock(S3ProductImageStorage.class);
        Product product = new Product(
                "birch-cream", "테스트 브랜드", "자작나무 크림", "크림", 82,
                "보습", "진정", 24000, "sage", null, "/products/original.jpg"
        );
        String objectKey = "hwaryeok/products/birch-cream/1789085100-12-object.png";
        String cdnUrl = "https://cdn.hwaryeok.co.kr/products/birch-cream/1789085100-12-object.png";
        when(productService.getAdminProduct("birch-cream")).thenReturn(product);
        when(s3Storage.confirmUpload("birch-cream", objectKey)).thenReturn(cdnUrl);
        ProductImageService service = new ProductImageService(productService, imageRepository, s3Storage);

        ProductResponse response = service.completeUpload(
                "birch-cream", new ProductImageUploadCompleteRequest(objectKey)
        );

        assertThat(product.getImageUrl()).isEqualTo(cdnUrl);
        assertThat(response.imageUrl()).isEqualTo(cdnUrl);
        verify(s3Storage).confirmUpload("birch-cream", objectKey);
        verifyNoInteractions(imageRepository);
    }

    @Test
    void failedCompletionNeverChangesExistingProductUrl() {
        ProductService productService = mock(ProductService.class);
        ProductImageRepository imageRepository = mock(ProductImageRepository.class);
        S3ProductImageStorage s3Storage = mock(S3ProductImageStorage.class);
        Product product = new Product(
                "birch-cream", "테스트 브랜드", "자작나무 크림", "크림", 82,
                "보습", "진정", 24000, "sage", null, "/products/original.jpg"
        );
        String objectKey = "hwaryeok/products/birch-cream/1789085100-12-object.png";
        when(productService.getAdminProduct("birch-cream")).thenReturn(product);
        when(s3Storage.confirmUpload("birch-cream", objectKey))
                .thenThrow(new IllegalArgumentException("업로드된 이미지 형식이 다릅니다."));
        ProductImageService service = new ProductImageService(productService, imageRepository, s3Storage);

        assertThatThrownBy(() -> service.completeUpload(
                "birch-cream", new ProductImageUploadCompleteRequest(objectKey)
        )).isInstanceOf(IllegalArgumentException.class);

        assertThat(product.getImageUrl()).isEqualTo("/products/original.jpg");
        verifyNoInteractions(imageRepository);
    }

    private Product product() {
        return new Product(
                "birch-cream", "테스트 브랜드", "자작나무 크림", "크림", 82,
                "보습", "진정", 24000, "sage", null
        );
    }
}

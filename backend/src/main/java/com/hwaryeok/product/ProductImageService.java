package com.hwaryeok.product;

import java.io.IOException;
import java.time.Instant;

import com.hwaryeok.common.error.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProductImageService {

    private final ProductService productService;
    private final ProductImageRepository productImageRepository;
    private final S3ProductImageStorage s3ProductImageStorage;

    public ProductImageService(
            ProductService productService,
            ProductImageRepository productImageRepository,
            S3ProductImageStorage s3ProductImageStorage
    ) {
        this.productService = productService;
        this.productImageRepository = productImageRepository;
        this.s3ProductImageStorage = s3ProductImageStorage;
    }

    @Transactional
    public ProductResponse upload(String productId, MultipartFile file) {
        Product product = productService.getAdminProduct(productId);
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("등록할 제품 이미지를 선택해 주세요.");
        if (file.getSize() > ProductImageValidation.MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("제품 이미지는 5MB 이하만 등록할 수 있어요.");
        }

        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException exception) {
            throw new IllegalArgumentException("이미지 파일을 읽을 수 없어요.");
        }
        String contentType = ProductImageValidation.detectContentType(data);
        String originalName = ProductImageValidation.cleanOriginalName(file.getOriginalFilename());

        if (s3ProductImageStorage.isEnabled()) {
            product.updateImageUrl(s3ProductImageStorage.upload(productId, data, contentType));
            return ProductResponse.from(product);
        }

        Instant now = Instant.now();
        ProductImage image = productImageRepository.findById(productId)
                .orElseGet(() -> new ProductImage(productId, originalName, contentType, data, now));
        image.replace(originalName, contentType, data, now);
        productImageRepository.save(image);

        product.updateImageUrl("/api/v1/media/products/" + productId);
        return ProductResponse.from(product);
    }

    @Transactional(readOnly = true)
    public ProductImageUploadUrlResponse createUploadUrl(
            String productId,
            ProductImageUploadUrlRequest request
    ) {
        productService.getAdminProduct(productId);
        if (request == null) throw new IllegalArgumentException("업로드할 이미지 정보를 입력해 주세요.");
        String contentType = ProductImageValidation.validateMetadata(
                request.fileName(), request.contentType(), request.size()
        );
        return s3ProductImageStorage.createUploadUrl(productId, contentType, request.size());
    }

    @Transactional
    public ProductResponse completeUpload(String productId, ProductImageUploadCompleteRequest request) {
        Product product = productService.getAdminProduct(productId);
        if (request == null) throw new IllegalArgumentException("업로드한 이미지 정보를 입력해 주세요.");

        // S3에 실제 객체가 있고 발급한 크기·형식·매직 바이트가 모두 일치하는지 확인한 뒤에만 DB URL을 바꿉니다.
        String imageUrl = s3ProductImageStorage.confirmUpload(productId, request.objectKey());
        product.updateImageUrl(imageUrl);
        return ProductResponse.from(product);
    }

    @Transactional(readOnly = true)
    public ProductImagePayload get(String productId) {
        ProductImage image = productImageRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("등록된 제품 이미지가 없어요: " + productId));
        return new ProductImagePayload(image.getOriginalName(), image.getContentType(), image.getImageData());
    }

}

package com.hwaryeok.product;

import java.io.IOException;
import java.time.Instant;

import com.hwaryeok.common.error.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProductImageService {

    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;

    private final ProductService productService;
    private final ProductImageRepository productImageRepository;

    public ProductImageService(ProductService productService, ProductImageRepository productImageRepository) {
        this.productService = productService;
        this.productImageRepository = productImageRepository;
    }

    @Transactional
    public ProductResponse upload(String productId, MultipartFile file) {
        Product product = productService.getAdminProduct(productId);
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("등록할 제품 이미지를 선택해 주세요.");
        if (file.getSize() > MAX_IMAGE_BYTES) throw new IllegalArgumentException("제품 이미지는 5MB 이하만 등록할 수 있어요.");

        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException exception) {
            throw new IllegalArgumentException("이미지 파일을 읽을 수 없어요.");
        }
        String contentType = detectContentType(data);
        String originalName = cleanOriginalName(file.getOriginalFilename());
        Instant now = Instant.now();
        ProductImage image = productImageRepository.findById(productId)
                .orElseGet(() -> new ProductImage(productId, originalName, contentType, data, now));
        image.replace(originalName, contentType, data, now);
        productImageRepository.save(image);

        product.updateImageUrl("/api/v1/media/products/" + productId);
        return ProductResponse.from(product);
    }

    @Transactional(readOnly = true)
    public ProductImagePayload get(String productId) {
        ProductImage image = productImageRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("등록된 제품 이미지가 없어요: " + productId));
        return new ProductImagePayload(image.getOriginalName(), image.getContentType(), image.getImageData());
    }

    private String cleanOriginalName(String originalName) {
        String cleaned = StringUtils.cleanPath(originalName == null ? "product-image" : originalName);
        int lastSlash = Math.max(cleaned.lastIndexOf('/'), cleaned.lastIndexOf('\\'));
        String fileName = lastSlash >= 0 ? cleaned.substring(lastSlash + 1) : cleaned;
        if (fileName.isBlank()) fileName = "product-image";
        return fileName.length() > 255 ? fileName.substring(fileName.length() - 255) : fileName;
    }

    private String detectContentType(byte[] data) {
        if (data.length >= 8
                && (data[0] & 0xff) == 0x89 && data[1] == 0x50 && data[2] == 0x4e && data[3] == 0x47
                && data[4] == 0x0d && data[5] == 0x0a && data[6] == 0x1a && data[7] == 0x0a) {
            return "image/png";
        }
        if (data.length >= 3 && (data[0] & 0xff) == 0xff && (data[1] & 0xff) == 0xd8 && (data[2] & 0xff) == 0xff) {
            return "image/jpeg";
        }
        if (data.length >= 12
                && data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
                && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') {
            return "image/webp";
        }
        throw new IllegalArgumentException("PNG, JPG, WEBP 형식의 실제 이미지 파일만 등록할 수 있어요.");
    }
}

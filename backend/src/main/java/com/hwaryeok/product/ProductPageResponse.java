package com.hwaryeok.product;

import java.util.List;

import org.springframework.data.domain.Page;

public record ProductPageResponse(
        List<ProductResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext
) {
    public static ProductPageResponse from(Page<Product> result) {
        return new ProductPageResponse(
                result.getContent().stream().map(ProductResponse::from).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext()
        );
    }
}

package com.hwaryeok.product;

public class ProductAlreadyExistsException extends RuntimeException {
    public ProductAlreadyExistsException(String productId) {
        super("이미 사용 중인 제품 ID예요: " + productId);
    }
}

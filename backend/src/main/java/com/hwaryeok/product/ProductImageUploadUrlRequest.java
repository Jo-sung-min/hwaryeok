package com.hwaryeok.product;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductImageUploadUrlRequest(
        @NotBlank(message = "이미지 파일 이름을 입력해 주세요.")
        @Size(max = 255, message = "이미지 파일 이름은 255자 이하로 입력해 주세요.")
        String fileName,
        @NotBlank(message = "이미지 형식을 입력해 주세요.")
        String contentType,
        @Min(value = 1, message = "등록할 제품 이미지가 비어 있어요.")
        @Max(value = ProductImageValidation.MAX_IMAGE_BYTES, message = "제품 이미지는 5MB 이하만 등록할 수 있어요.")
        long size
) {
}

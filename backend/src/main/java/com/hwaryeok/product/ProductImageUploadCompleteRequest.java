package com.hwaryeok.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductImageUploadCompleteRequest(
        @NotBlank(message = "업로드한 이미지 경로를 입력해 주세요.")
        @Size(max = 1024, message = "업로드한 이미지 경로를 확인해 주세요.")
        String objectKey
) {
}

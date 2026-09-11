package com.hwaryeok.review;

import java.math.BigDecimal;
import java.time.Instant;

import com.hwaryeok.product.Product;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductSampleReviewService {

    private final ProductSampleReviewRepository repository;

    public ProductSampleReviewService(ProductSampleReviewRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void createFor(Product product) {
        if (repository.existsByProductId(product.getId())) return;
        Instant now = Instant.now();
        repository.save(new ProductSampleReview(
                "sample:" + product.getId(),
                product,
                BigDecimal.valueOf(80),
                contentFor(product.getCategory()),
                skinTypeFor(product.getCategory()),
                "ONE_MONTH",
                true,
                now
        ));
    }

    private String contentFor(String category) {
        return switch (category) {
            case "토너" -> "세안 뒤 여러 번 덧발라도 부담이 적고 촉촉하게 정돈되는 사용감이었어요.";
            case "세럼", "앰플", "에센스" -> "소량으로도 부드럽게 펴 발리고 흡수된 뒤 피부가 편안하게 느껴졌어요.";
            case "크림", "젤" -> "마무리가 답답하지 않으면서 건조한 부위의 촉촉함이 오래 유지됐어요.";
            case "선케어", "선크림" -> "고르게 펴 바르기 쉽고 일상에서 부담 없이 덧바르기 좋은 사용감이었어요.";
            case "클렌저", "클렌징폼" -> "부드럽게 세정되고 헹군 뒤에도 피부가 과하게 당기지 않아 편안했어요.";
            case "마스크팩" -> "피부에 편안하게 밀착되고 사용 뒤 촉촉하고 산뜻한 느낌이 남았어요.";
            default -> "제형이 편안하고 꾸준히 사용하기에 무리가 적은 제품으로 느껴졌어요.";
        };
    }

    private String skinTypeFor(String category) {
        return switch (category) {
            case "크림", "젤" -> "건성";
            case "세럼", "앰플", "에센스" -> "복합성";
            case "클렌저", "클렌징폼" -> "수부지";
            case "선케어", "선크림" -> "중성";
            default -> "민감";
        };
    }
}

package com.hwaryeok.promotion;

import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductPublicationStatus;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.review.ReviewService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PromotionService {

    private final ProductPromotionRepository promotionRepository;
    private final ProductService productService;
    private final ReviewService reviewService;

    public PromotionService(
            ProductPromotionRepository promotionRepository,
            ProductService productService,
            ReviewService reviewService
    ) {
        this.promotionRepository = promotionRepository;
        this.productService = productService;
        this.reviewService = reviewService;
    }

    public List<PromotionResponse> findVisible(int limit) {
        if (limit < 1 || limit > 30) throw new IllegalArgumentException("광고 상품 수는 1~30개 사이여야 해요.");
        LocalDate today = LocalDate.now();
        return promotionRepository.findVisible(today, PageRequest.of(0, limit)).stream()
                .map(promotion -> response(promotion, true))
                .toList();
    }

    public List<PromotionResponse> findAll() {
        LocalDate today = LocalDate.now();
        return promotionRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(promotion -> response(promotion, isCurrentlyVisible(promotion, today)))
                .toList();
    }

    @Transactional
    public PromotionResponse create(PromotionRequest request) {
        String productId = request.productId().strip();
        if (promotionRepository.existsByProductId(productId)) {
            throw new IllegalArgumentException("이 제품은 이미 광고에 등록되어 있어요. 기존 광고를 수정해 주세요.");
        }
        Product product = productService.getAdminProduct(productId);
        ValidatedPromotion values = validate(request);
        ProductPromotion promotion = new ProductPromotion(
                UUID.randomUUID().toString(),
                product,
                request.recommendationScore(),
                request.headline().strip(),
                request.recommendationReason().strip(),
                values.destinationUrl(),
                request.emergingBrand(),
                request.status(),
                request.startsOn(),
                request.endsOn(),
                Instant.now()
        );
        ProductPromotion saved = promotionRepository.saveAndFlush(promotion);
        return response(saved, isCurrentlyVisible(saved, LocalDate.now()));
    }

    @Transactional
    public PromotionResponse update(String promotionId, PromotionRequest request) {
        ProductPromotion promotion = get(promotionId);
        if (!promotion.getProduct().getId().equals(request.productId().strip())) {
            throw new IllegalArgumentException("광고에 연결된 제품은 변경할 수 없어요.");
        }
        ValidatedPromotion values = validate(request);
        promotion.update(
                request.recommendationScore(),
                request.headline().strip(),
                request.recommendationReason().strip(),
                values.destinationUrl(),
                request.emergingBrand(),
                request.status(),
                request.startsOn(),
                request.endsOn(),
                Instant.now()
        );
        return response(promotion, isCurrentlyVisible(promotion, LocalDate.now()));
    }

    @Transactional
    public void delete(String promotionId) {
        promotionRepository.delete(get(promotionId));
    }

    private ProductPromotion get(String id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("광고를 찾을 수 없어요."));
    }

    private ValidatedPromotion validate(PromotionRequest request) {
        if (request.startsOn() != null && request.endsOn() != null && request.endsOn().isBefore(request.startsOn())) {
            throw new IllegalArgumentException("광고 종료일은 시작일보다 빠를 수 없어요.");
        }
        String destinationUrl = request.destinationUrl().strip();
        try {
            URI uri = URI.create(destinationUrl);
            String host = uri.getHost();
            if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null) throw new IllegalArgumentException();
            String normalizedHost = host.toLowerCase(Locale.ROOT);
            if (!normalizedHost.equals("coupang.com") && !normalizedHost.endsWith(".coupang.com")) {
                throw new IllegalArgumentException();
            }
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("쿠팡 공식판매처의 https 주소만 등록할 수 있어요.");
        }
        return new ValidatedPromotion(destinationUrl);
    }

    private PromotionResponse response(ProductPromotion promotion, boolean currentlyVisible) {
        return PromotionResponse.from(
                promotion,
                productService.toNeutralResponse(promotion.getProduct()),
                reviewService.metrics(promotion.getProduct().getId()),
                currentlyVisible
        );
    }

    private boolean isCurrentlyVisible(ProductPromotion promotion, LocalDate today) {
        return promotion.isVisibleOn(today)
                && promotion.getProduct().getPublicationStatus() == ProductPublicationStatus.PUBLISHED;
    }

    private record ValidatedPromotion(String destinationUrl) {
    }
}

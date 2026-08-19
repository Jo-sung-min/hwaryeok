package com.hwaryeok.review;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.hwaryeok.auth.InvalidCredentialsException;
import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductService;
import com.hwaryeok.user.User;
import com.hwaryeok.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private static final Set<String> SKIN_TYPES = Set.of("건성", "지성", "복합성", "수부지", "중성", "민감", "민감성");
    private static final Set<String> USAGE_PERIODS = Set.of("ONE_WEEK", "TWO_WEEKS", "ONE_MONTH", "THREE_MONTHS", "OVER_SIX_MONTHS");
    private static final int MINIMUM_OFFICIAL_REVIEW_COUNT = 50;

    private final ProductService productService;
    private final UserRepository userRepository;
    private final ReviewTemplateRepository templateRepository;
    private final ReviewCriterionRepository criterionRepository;
    private final ProductReviewRepository reviewRepository;

    public ReviewService(
            ProductService productService,
            UserRepository userRepository,
            ReviewTemplateRepository templateRepository,
            ReviewCriterionRepository criterionRepository,
            ProductReviewRepository reviewRepository
    ) {
        this.productService = productService;
        this.userRepository = userRepository;
        this.templateRepository = templateRepository;
        this.criterionRepository = criterionRepository;
        this.reviewRepository = reviewRepository;
    }

    @Transactional(readOnly = true)
    public ReviewCriteriaResponse criteria(String productId) {
        Product product = productService.getProduct(productId);
        TemplateContext context = templateFor(product);
        return criteriaResponse(context);
    }

    @Transactional(readOnly = true)
    public ProductReviewSummaryResponse summary(String productId) {
        Product product = productService.getProduct(productId);
        TemplateContext context = templateFor(product);
        List<ProductReview> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        BigDecimal reviewScore = reviews.isEmpty() ? null : reviews.stream()
                .map(ProductReview::getTotalScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(reviews.size()), 1, RoundingMode.HALF_UP);

        Map<String, List<ProductReviewScore>> scoresByCriterion = reviews.stream()
                .flatMap(review -> review.getScores().stream())
                .collect(Collectors.groupingBy(score -> score.getCriterion().getId()));
        List<ReviewCriterionAverageResponse> averages = context.criteria().stream()
                .map(criterion -> average(criterion, scoresByCriterion.getOrDefault(criterion.getId(), List.of())))
                .toList();

        return new ProductReviewSummaryResponse(
                productId,
                reviewScore,
                reviews.size(),
                rankingStatus(reviews.size()),
                MINIMUM_OFFICIAL_REVIEW_COUNT,
                averages,
                reviews.stream().map(ReviewDetailResponse::from).toList()
        );
    }

    @Transactional
    public ReviewDetailResponse create(String userId, String productId, CreateReviewRequest request) {
        User user = userRepository.findById(userId)
                .filter(candidate -> "ACTIVE".equals(candidate.getStatus()))
                .orElseThrow(InvalidCredentialsException::new);
        Product product = productService.getProduct(productId);
        TemplateContext context = templateFor(product);
        validateMetadata(request);
        Map<String, Integer> submittedScores = validateScores(context.criteria(), request.scores());
        if (reviewRepository.existsByProductIdAndUserId(productId, userId)) {
            throw new ReviewAlreadyExistsException();
        }

        BigDecimal totalScore = calculateTotalScore(context.criteria(), submittedScores);
        Instant now = Instant.now();
        ProductReview review = new ProductReview(
                UUID.randomUUID().toString(),
                product,
                user,
                context.template(),
                totalScore,
                request.content().trim(),
                request.skinType(),
                request.usagePeriod(),
                request.repurchaseYn(),
                now
        );
        context.criteria().forEach(criterion -> review.addScore(new ProductReviewScore(
                UUID.randomUUID().toString(),
                review,
                criterion,
                submittedScores.get(criterion.getId()),
                now
        )));
        return ReviewDetailResponse.from(reviewRepository.saveAndFlush(review));
    }

    private TemplateContext templateFor(Product product) {
        String categoryId = switch (product.getCategory()) {
            case "크림", "젤" -> "MOISTURIZER";
            case "선케어", "선크림" -> "SUNSCREEN";
            case "클렌저", "클렌징폼" -> "CLEANSER";
            case "토너" -> "TONER";
            case "세럼", "앰플", "에센스" -> "ESSENCE_SERUM";
            default -> "GENERIC";
        };
        ReviewTemplate template = templateRepository.findFirstByCategoryIdAndActiveTrueOrderByVersionDesc(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("리뷰 평가 기준을 찾을 수 없어요."));
        List<ReviewCriterion> criteria = criterionRepository.findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(template.getId());
        if (criteria.isEmpty()) throw new ResourceNotFoundException("리뷰 평가 항목을 찾을 수 없어요.");
        return new TemplateContext(template, criteria);
    }

    private ReviewCriteriaResponse criteriaResponse(TemplateContext context) {
        return new ReviewCriteriaResponse(
                context.template().getCategory().getId(),
                context.template().getCategory().getName(),
                context.template().getId(),
                context.template().getVersion(),
                context.criteria().stream().map(ReviewCriterionResponse::from).toList()
        );
    }

    private void validateMetadata(CreateReviewRequest request) {
        if (!SKIN_TYPES.contains(request.skinType())) throw new IllegalArgumentException("피부 타입을 다시 선택해 주세요.");
        if (!USAGE_PERIODS.contains(request.usagePeriod())) throw new IllegalArgumentException("사용 기간을 다시 선택해 주세요.");
    }

    private Map<String, Integer> validateScores(List<ReviewCriterion> criteria, List<ReviewScoreRequest> scores) {
        Map<String, Integer> submitted = new LinkedHashMap<>();
        for (ReviewScoreRequest score : scores) {
            if (submitted.put(score.criteriaId(), score.score()) != null) {
                throw new IllegalArgumentException("같은 평가 항목은 한 번만 선택할 수 있어요.");
            }
        }
        Set<String> expected = criteria.stream().map(ReviewCriterion::getId).collect(Collectors.toSet());
        if (!submitted.keySet().equals(expected)) {
            throw new IllegalArgumentException("모든 평가 항목의 점수를 선택해 주세요.");
        }
        return submitted;
    }

    private BigDecimal calculateTotalScore(List<ReviewCriterion> criteria, Map<String, Integer> scores) {
        BigDecimal weightedScore = criteria.stream()
                .map(criterion -> criterion.getWeight().multiply(BigDecimal.valueOf(scores.get(criterion.getId()))))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal maximum = criteria.stream()
                .map(ReviewCriterion::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(BigDecimal.valueOf(5));
        return weightedScore.multiply(BigDecimal.valueOf(100)).divide(maximum, 2, RoundingMode.HALF_UP);
    }

    private ReviewCriterionAverageResponse average(ReviewCriterion criterion, List<ProductReviewScore> scores) {
        BigDecimal average = scores.isEmpty() ? null : BigDecimal.valueOf(scores.stream()
                        .mapToInt(ProductReviewScore::getScore)
                        .average()
                        .orElse(0))
                .setScale(1, RoundingMode.HALF_UP);
        return new ReviewCriterionAverageResponse(
                criterion.getId(),
                criterion.getCode(),
                criterion.getName(),
                criterion.getDescription(),
                average,
                scores.size()
        );
    }

    private String rankingStatus(long reviewCount) {
        if (reviewCount < 10) return "COLLECTING";
        if (reviewCount < MINIMUM_OFFICIAL_REVIEW_COUNT) return "REFERENCE";
        return "OFFICIAL";
    }

    private record TemplateContext(ReviewTemplate template, List<ReviewCriterion> criteria) {
    }
}

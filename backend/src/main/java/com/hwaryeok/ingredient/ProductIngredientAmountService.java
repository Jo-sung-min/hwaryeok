package com.hwaryeok.ingredient;

import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductIngredientAmountService {

    private final ProductIngredientRepository productIngredientRepository;
    private final ProductIngredientAmountClaimRepository claimRepository;
    private final ProductRepository productRepository;

    public ProductIngredientAmountService(
            ProductIngredientRepository productIngredientRepository,
            ProductIngredientAmountClaimRepository claimRepository,
            ProductRepository productRepository
    ) {
        this.productIngredientRepository = productIngredientRepository;
        this.claimRepository = claimRepository;
        this.productRepository = productRepository;
    }

    public Map<String, IngredientAmountResponse> findVerifiedResponses(Product product) {
        return responses(product, claimRepository.findByProductIdAndStatus(
                product.getId(), IngredientAmountVerificationStatus.VERIFIED
        ));
    }

    public Map<String, IngredientAmountResponse> findAdminResponses(Product product) {
        return responses(product, claimRepository.findByProductId(product.getId()));
    }

    public Map<ProductIngredientId, ProductIngredientAmountClaim> findVerifiedClaims(Set<String> productIds) {
        if (productIds.isEmpty()) return Map.of();
        return claimRepository.findByProductIdsAndStatus(productIds, IngredientAmountVerificationStatus.VERIFIED)
                .stream()
                .collect(Collectors.toMap(ProductIngredientAmountClaim::getId, claim -> claim));
    }

    public Map<String, ProductIngredientAmountClaim> findVerifiedClaims(String ingredientId, Set<String> productIds) {
        if (productIds.isEmpty()) return Map.of();
        return claimRepository.findByIngredientIdAndProductIdsAndStatus(
                        ingredientId, productIds, IngredientAmountVerificationStatus.VERIFIED
                ).stream()
                .collect(Collectors.toMap(claim -> claim.getId().getProductId(), claim -> claim));
    }

    @Transactional
    public IngredientAmountResponse save(
            String productId,
            String ingredientId,
            String reviewerId,
            AdminProductIngredientAmountRequest request
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("제품을 찾을 수 없어요: " + productId));
        ProductIngredientId id = new ProductIngredientId(productId, ingredientId);
        if (!productIngredientRepository.existsById(id)) {
            throw new ResourceNotFoundException("제품에 연결된 성분을 찾을 수 없어요: " + ingredientId);
        }
        validateShape(request);
        String sourceUrl = validateSourceUrl(request.sourceUrl());
        ProductIngredientAmountClaim claim = claimRepository.findById(id)
                .orElseGet(() -> new ProductIngredientAmountClaim(productId, ingredientId));
        claim.update(
                request.kind(), request.minAmount(), request.maxAmount(), request.unit(), request.basis(),
                request.substanceBasis(), request.rawClaimText().strip(), request.sourceType(), sourceUrl,
                request.pageTitle().strip(), request.sourceIngredientName().strip(), request.checkedAt(),
                request.verificationStatus(), normalizeOptional(request.reviewNote()), reviewerId, Instant.now()
        );
        return IngredientAmountResponse.from(claimRepository.saveAndFlush(claim), product);
    }

    @Transactional
    public void delete(String productId, String ingredientId) {
        ProductIngredientId id = new ProductIngredientId(productId, ingredientId);
        if (!claimRepository.existsById(id)) {
            throw new ResourceNotFoundException("삭제할 성분 함량 근거를 찾을 수 없어요.");
        }
        claimRepository.deleteById(id);
    }

    @Transactional
    public void markStale(String productId, Set<String> ingredientIds) {
        if (ingredientIds.isEmpty()) return;
        Instant now = Instant.now();
        claimRepository.findByProductId(productId).stream()
                .filter(claim -> ingredientIds.contains(claim.getId().getIngredientId()))
                .forEach(claim -> claim.markStale(now));
        claimRepository.flush();
    }

    private Map<String, IngredientAmountResponse> responses(
            Product product,
            List<ProductIngredientAmountClaim> claims
    ) {
        Map<String, IngredientAmountResponse> responses = new LinkedHashMap<>();
        for (ProductIngredientAmountClaim claim : claims) {
            responses.put(claim.getId().getIngredientId(), IngredientAmountResponse.from(claim, product));
        }
        return responses;
    }

    private void validateShape(AdminProductIngredientAmountRequest request) {
        BigDecimal min = request.minAmount();
        BigDecimal max = request.maxAmount();
        boolean valid = switch (request.kind()) {
            case EXACT -> min != null && max != null && min.compareTo(max) == 0;
            case RANGE -> min != null && max != null && min.compareTo(max) <= 0;
            case MINIMUM -> min != null && max == null;
            case MAXIMUM -> min == null && max != null;
        };
        if (!valid) {
            throw new IllegalArgumentException("함량 표시 방식과 최소·최대 함량의 조합을 확인해 주세요.");
        }
        if ((min != null && min.signum() <= 0) || (max != null && max.signum() <= 0)) {
            throw new IllegalArgumentException("공개되지 않은 함량은 0으로 입력하지 말고, 함량 값은 0보다 크게 입력해 주세요.");
        }
        if (request.unit() == IngredientAmountUnit.PERCENT
                && ((min != null && min.compareTo(BigDecimal.valueOf(100)) > 0)
                || (max != null && max.compareTo(BigDecimal.valueOf(100)) > 0))) {
            throw new IllegalArgumentException("퍼센트 함량은 100% 이하여야 해요.");
        }
        if (request.unit() == IngredientAmountUnit.MG_PER_G
                && request.basis() != IngredientAmountBasis.W_W) {
            throw new IllegalArgumentException("mg/g 단위는 중량 대비 중량(W_W) 기준으로 입력해 주세요.");
        }
        if (request.unit() == IngredientAmountUnit.MG_PER_ML
                && request.basis() != IngredientAmountBasis.W_V) {
            throw new IllegalArgumentException("mg/mL 단위는 부피 대비 중량(W_V) 기준으로 입력해 주세요.");
        }
        if (request.checkedAt().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("함량 근거 확인일은 미래 날짜로 입력할 수 없어요.");
        }
    }

    private String validateSourceUrl(String sourceUrl) {
        URI uri;
        try {
            uri = URI.create(sourceUrl.strip());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("함량 근거 주소 형식을 확인해 주세요.");
        }
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null) {
            throw new IllegalArgumentException("함량 근거는 사용자 정보가 없는 https 주소만 등록할 수 있어요.");
        }
        return uri.toString();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}

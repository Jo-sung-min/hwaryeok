package com.hwaryeok.ingredient;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.product.ProductService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class IngredientService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("name", "englishName", "role", "status");

    private final IngredientRepository ingredientRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final ProductService productService;

    public IngredientService(IngredientRepository ingredientRepository,
                             ProductIngredientRepository productIngredientRepository,
                             ProductService productService) {
        this.ingredientRepository = ingredientRepository;
        this.productIngredientRepository = productIngredientRepository;
        this.productService = productService;
    }

    public IngredientPageResponse findIngredients(String query, String status, String tag, int page, int size,
                                                  String sort, String direction) {
        if (page < 0) throw new IllegalArgumentException("페이지 번호는 0 이상이어야 해요.");
        if (size < 1 || size > 50) throw new IllegalArgumentException("페이지 크기는 1~50 사이여야 해요.");

        String sortField = ALLOWED_SORT_FIELDS.contains(sort) ? sort : "name";
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        IngredientStatus parsedStatus = parseStatus(status);
        var result = ingredientRepository.search(
                normalize(query),
                parsedStatus,
                normalize(tag),
                PageRequest.of(page, size, Sort.by(sortDirection, sortField))
        );
        return IngredientPageResponse.from(result);
    }

    public IngredientDetailResponse findIngredient(String id) {
        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("성분을 찾을 수 없어요: " + id));
        return IngredientDetailResponse.from(ingredient, productIngredientRepository.findByIngredientId(id));
    }

    public ProductIngredientsResponse findProductIngredients(String productId, String status, String tag) {
        productService.getProduct(productId);
        IngredientStatus parsedStatus = parseStatus(status);
        String normalizedTag = normalize(tag);
        List<ProductIngredient> allRelations = productIngredientRepository.findByProductId(productId);
        List<ProductIngredient> filtered = allRelations.stream()
                .filter(relation -> parsedStatus == null || relation.getIngredient().getStatus() == parsedStatus)
                .filter(relation -> normalizedTag.isBlank() || relation.getIngredient().getTags().contains(normalizedTag))
                .toList();
        return ProductIngredientsResponse.from(productId, allRelations, filtered);
    }

    private IngredientStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return IngredientStatus.valueOf(status.strip().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("성분 상태는 GOOD, CAUTION, NEUTRAL 중 하나여야 해요.");
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.strip();
    }
}

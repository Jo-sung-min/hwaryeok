package com.hwaryeok.ingredient;

import java.util.HashMap;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.product.Product;
import com.hwaryeok.product.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminProductIngredientService {

    private final IngredientRepository ingredientRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final ProductService productService;
    private final ProductIngredientSourceService productIngredientSourceService;
    private final ProductIngredientAmountService productIngredientAmountService;

    public AdminProductIngredientService(
            IngredientRepository ingredientRepository,
            ProductIngredientRepository productIngredientRepository,
            ProductService productService,
            ProductIngredientSourceService productIngredientSourceService,
            ProductIngredientAmountService productIngredientAmountService
    ) {
        this.ingredientRepository = ingredientRepository;
        this.productIngredientRepository = productIngredientRepository;
        this.productService = productService;
        this.productIngredientSourceService = productIngredientSourceService;
        this.productIngredientAmountService = productIngredientAmountService;
    }

    public ProductIngredientsResponse find(String productId) {
        Product product = productService.getAdminProduct(productId);
        List<ProductIngredient> relations = productIngredientRepository.findByProductId(productId);
        return ProductIngredientsResponse.from(
                productId, relations, relations, null, Map.of(),
                productIngredientAmountService.findAdminResponses(product)
        );
    }

    @Transactional
    public ProductIngredientsResponse replace(String productId, AdminProductIngredientRequest request) {
        Product product = productService.getAdminProduct(productId);
        List<AdminProductIngredientRequest.Item> requested = request.ingredients();
        Set<String> uniqueIds = new HashSet<>();
        for (AdminProductIngredientRequest.Item item : requested) {
            String ingredientId = item.ingredientId().strip();
            if (!uniqueIds.add(ingredientId)) {
                throw new IllegalArgumentException("같은 성분을 두 번 연결할 수 없어요: " + ingredientId);
            }
        }

        Map<String, Ingredient> ingredientsById = new HashMap<>();
        ingredientRepository.findAllById(uniqueIds)
                .forEach(ingredient -> ingredientsById.put(ingredient.getId(), ingredient));
        if (ingredientsById.size() != uniqueIds.size()) {
            String missingId = uniqueIds.stream().filter(id -> !ingredientsById.containsKey(id)).findFirst().orElse("");
            throw new ResourceNotFoundException("성분을 찾을 수 없어요: " + missingId);
        }

        Map<String, ProductIngredient> existingByIngredientId = productIngredientRepository.findByProductId(productId)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        relation -> relation.getIngredient().getId(),
                        relation -> relation,
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ));
        List<ProductIngredient> removed = existingByIngredientId.entrySet().stream()
                .filter(entry -> !uniqueIds.contains(entry.getKey()))
                .map(Map.Entry::getValue)
                .toList();
        if (!removed.isEmpty()) {
            productIngredientAmountService.markStale(
                    productId,
                    removed.stream().map(relation -> relation.getIngredient().getId()).collect(java.util.stream.Collectors.toSet())
            );
            productIngredientRepository.deleteAll(removed);
            productIngredientRepository.flush();
        }

        // Move retained rows away from their final positions first so swaps never violate
        // the unique (product_id, display_order) constraint during a Hibernate flush.
        List<ProductIngredient> retained = existingByIngredientId.entrySet().stream()
                .filter(entry -> uniqueIds.contains(entry.getKey()))
                .map(Map.Entry::getValue)
                .toList();
        int temporaryStart = existingByIngredientId.values().stream()
                .mapToInt(ProductIngredient::getDisplayOrder)
                .max()
                .orElse(0) + requested.size() + 1;
        for (int index = 0; index < retained.size(); index++) {
            ProductIngredient relation = retained.get(index);
            relation.updateDetails(temporaryStart + index, relation.getConcentrationNote(), relation.isKeyIngredient());
        }
        if (!retained.isEmpty()) productIngredientRepository.flush();

        List<ProductIngredient> relations = new ArrayList<>();
        for (int index = 0; index < requested.size(); index++) {
            AdminProductIngredientRequest.Item item = requested.get(index);
            String ingredientId = item.ingredientId().strip();
            ProductIngredient existing = existingByIngredientId.get(ingredientId);
            boolean keyIngredient = item.isKeyIngredient() == null
                    ? existing != null && existing.isKeyIngredient()
                    : item.isKeyIngredient();
            if (existing == null) {
                existing = new ProductIngredient(
                        product,
                        ingredientsById.get(ingredientId),
                        index + 1,
                        normalizeOptional(item.concentrationNote()),
                        keyIngredient
                );
            } else {
                existing.updateDetails(index + 1, normalizeOptional(item.concentrationNote()), keyIngredient);
            }
            relations.add(existing);
        }
        productIngredientRepository.saveAllAndFlush(relations);
        productIngredientSourceService.markUnpublished(productId);
        return ProductIngredientsResponse.from(
                productId, relations, relations, null, Map.of(),
                productIngredientAmountService.findAdminResponses(product)
        );
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}

package com.hwaryeok.ingredient;

import java.util.HashMap;
import java.util.HashSet;
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

    public AdminProductIngredientService(
            IngredientRepository ingredientRepository,
            ProductIngredientRepository productIngredientRepository,
            ProductService productService
    ) {
        this.ingredientRepository = ingredientRepository;
        this.productIngredientRepository = productIngredientRepository;
        this.productService = productService;
    }

    public ProductIngredientsResponse find(String productId) {
        productService.getAdminProduct(productId);
        List<ProductIngredient> relations = productIngredientRepository.findByProductId(productId);
        return ProductIngredientsResponse.from(productId, relations, relations);
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

        productIngredientRepository.deleteAllInBatch(productIngredientRepository.findByProductId(productId));
        List<ProductIngredient> relations = java.util.stream.IntStream.range(0, requested.size())
                .mapToObj(index -> {
                    AdminProductIngredientRequest.Item item = requested.get(index);
                    return new ProductIngredient(
                            product,
                            ingredientsById.get(item.ingredientId().strip()),
                            index + 1,
                            normalizeOptional(item.concentrationNote())
                    );
                })
                .toList();
        productIngredientRepository.saveAll(relations);
        return ProductIngredientsResponse.from(productId, relations, relations);
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}

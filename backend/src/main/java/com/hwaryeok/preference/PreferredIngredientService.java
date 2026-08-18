package com.hwaryeok.preference;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.hwaryeok.auth.InvalidCredentialsException;
import com.hwaryeok.ingredient.Ingredient;
import com.hwaryeok.ingredient.IngredientRepository;
import com.hwaryeok.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PreferredIngredientService {

    private final UserPreferredIngredientRepository preferenceRepository;
    private final IngredientRepository ingredientRepository;
    private final UserRepository userRepository;

    public PreferredIngredientService(
            UserPreferredIngredientRepository preferenceRepository,
            IngredientRepository ingredientRepository,
            UserRepository userRepository
    ) {
        this.preferenceRepository = preferenceRepository;
        this.ingredientRepository = ingredientRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PreferredIngredientsResponse get(String userId) {
        requireActiveUser(userId);
        return PreferredIngredientsResponse.from(preferenceRepository.findByUserId(userId));
    }

    @Transactional
    public PreferredIngredientsResponse save(String userId, PreferredIngredientsRequest request) {
        requireActiveUser(userId);
        List<String> ingredientIds = request.ingredientIds().stream().map(String::strip).toList();
        if (new LinkedHashSet<>(ingredientIds).size() != ingredientIds.size()) {
            throw new IllegalArgumentException("같은 관심 성분을 중복해서 선택할 수 없어요.");
        }

        Map<String, Ingredient> ingredients = ingredientRepository.findAllById(ingredientIds).stream()
                .collect(Collectors.toMap(Ingredient::getId, Function.identity()));
        List<String> missingIds = ingredientIds.stream().filter(id -> !ingredients.containsKey(id)).toList();
        if (!missingIds.isEmpty()) {
            throw new IllegalArgumentException("등록되지 않은 성분이 포함되어 있어요: " + String.join(", ", missingIds));
        }

        preferenceRepository.deleteAllByUserId(userId);
        preferenceRepository.flush();
        Instant now = Instant.now();
        List<UserPreferredIngredient> preferences = new ArrayList<>();
        for (int index = 0; index < ingredientIds.size(); index++) {
            preferences.add(new UserPreferredIngredient(userId, ingredients.get(ingredientIds.get(index)), index + 1, now));
        }
        preferenceRepository.saveAllAndFlush(preferences);
        return PreferredIngredientsResponse.from(preferenceRepository.findByUserId(userId));
    }

    private void requireActiveUser(String userId) {
        boolean active = userRepository.findById(userId)
                .filter(user -> "ACTIVE".equals(user.getStatus()))
                .isPresent();
        if (!active) throw new InvalidCredentialsException();
    }
}

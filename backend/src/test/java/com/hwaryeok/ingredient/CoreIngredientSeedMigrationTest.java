package com.hwaryeok.ingredient;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Transactional
class CoreIngredientSeedMigrationTest {

    private static final String MIGRATION_PATH = "db/migration/V34__seed_twenty_core_ingredients.sql";

    private static final List<String> EXISTING_INGREDIENT_IDS = List.of(
            "panthenol", "niacinamide", "ceramide-np", "hyaluronic-acid", "heartleaf",
            "mugwort-extract", "birch-sap", "rice-extract", "soybean-ferment",
            "shea-butter", "ethanol"
    );

    private static final List<String> CORE_INGREDIENT_IDS = List.of(
            "retinol", "salicylic-acid", "glycolic-acid", "lactic-acid", "gluconolactone",
            "mandelic-acid", "azelaic-acid", "tranexamic-acid", "alpha-arbutin",
            "ethyl-ascorbic-acid", "ascorbyl-glucoside", "bisabolol", "allantoin", "caffeine",
            "ferulic-acid", "tocopherol", "urea", "zinc-pca", "titanium-dioxide", "zinc-oxide"
    );

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private ObjectMapper objectMapper;

    @LocalServerPort
    private int port;

    @Test
    void seedsExactlyTwentyCoreIngredientsWithoutReplacingTheExistingDictionary() {
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ingredients", Long.class)).isEqualTo(31L);
        assertThat(ingredientIdsBetweenDisplayOrders(1, 11)).containsExactlyElementsOf(EXISTING_INGREDIENT_IDS);
        assertThat(ingredientIdsBetweenDisplayOrders(12, 31)).containsExactlyElementsOf(CORE_INGREDIENT_IDS);

        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM ingredients
                WHERE display_order BETWEEN 12 AND 31
                  AND featured = TRUE
                  AND role <> ''
                  AND description <> ''
                  AND evidence_level IN ('A', 'B', 'C')
                  AND status IN ('GOOD', 'CAUTION', 'NEUTRAL')
                """, Long.class)).isEqualTo(20L);
    }

    @Test
    void givesEveryCoreIngredientDictionaryDetailsAndMatchingAliases() {
        assertEveryCoreIngredientHasRows("ingredient_tags", 2);
        assertEveryCoreIngredientHasRows("ingredient_skin_type_features", 2);
        assertEveryCoreIngredientHasRows("ingredient_concern_features", 2);

        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM cosmetic_ingredient_references reference
                JOIN ingredients ingredient ON ingredient.id = reference.source_ingredient_id
                WHERE reference.source_id = 'LEGACY_CURATED'
                  AND ingredient.display_order BETWEEN 12 AND 31
                  AND reference.standard_name = ingredient.name
                  AND reference.english_name = ingredient.english_name
                  AND reference.normalized_name <> ''
                """, Long.class)).isEqualTo(20L);
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM cosmetic_ingredient_aliases alias
                JOIN ingredients ingredient ON ingredient.id = alias.source_ingredient_id
                WHERE alias.source_id = 'LEGACY_CURATED'
                  AND ingredient.display_order BETWEEN 12 AND 31
                  AND alias.alias_type = 'STANDARD'
                  AND alias.alias = ingredient.name
                  AND alias.normalized_alias <> ''
                """, Long.class)).isEqualTo(20L);
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM cosmetic_ingredient_aliases alias
                JOIN ingredients ingredient ON ingredient.id = alias.source_ingredient_id
                WHERE alias.source_id = 'LEGACY_CURATED'
                  AND ingredient.display_order BETWEEN 12 AND 31
                  AND alias.alias_type = 'ENGLISH'
                  AND alias.alias = ingredient.english_name
                  AND alias.normalized_alias <> ''
                """, Long.class)).isEqualTo(20L);
    }

    @Test
    void canApplyTheCoreIngredientSeedAgainWithoutCreatingDuplicates() {
        Map<String, Long> before = dictionaryTableCounts();
        Connection connection = DataSourceUtils.getConnection(dataSource);
        try {
            ScriptUtils.executeSqlScript(
                    connection,
                    new EncodedResource(new ClassPathResource(MIGRATION_PATH), StandardCharsets.UTF_8)
            );
        } finally {
            DataSourceUtils.releaseConnection(connection, dataSource);
        }

        assertThat(dictionaryTableCounts()).isEqualTo(before);
        assertThat(ingredientIdsBetweenDisplayOrders(12, 31)).containsExactlyElementsOf(CORE_INGREDIENT_IDS);
    }

    @Test
    void exposesAllSeededIngredientsThroughThePublicListAndDetailApis() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        JsonNode page = getJson(client, "/api/v1/ingredients?page=0&size=50&sort=name&direction=asc");

        assertThat(page.get("totalElements").asLong()).isEqualTo(31L);
        assertThat(page.get("content").size()).isEqualTo(31);
        assertThat(page.get("totalPages").asInt()).isEqualTo(1);
        assertThat(page.get("hasNext").asBoolean()).isFalse();
        assertThat(page.get("content")).extracting(item -> item.get("id").asString())
                .containsAll(CORE_INGREDIENT_IDS)
                .containsAll(EXISTING_INGREDIENT_IDS);

        for (String ingredientId : CORE_INGREDIENT_IDS) {
            JsonNode detail = getJson(client, "/api/v1/ingredients/" + ingredientId);
            assertThat(detail.get("id").asString()).isEqualTo(ingredientId);
            assertThat(detail.get("name").asString()).isNotBlank();
            assertThat(detail.get("englishName").asString()).isNotBlank();
            assertThat(detail.get("role").asString()).isNotBlank();
            assertThat(detail.get("description").asString()).isNotBlank();
            assertThat(detail.get("tags").size()).isGreaterThanOrEqualTo(2);
            assertThat(detail.get("skinTypeFeatures").size()).isEqualTo(2);
            assertThat(detail.get("concernFeatures").size()).isEqualTo(2);
            assertThat(detail.get("products").isArray()).isTrue();
        }
    }

    private List<String> ingredientIdsBetweenDisplayOrders(int first, int last) {
        return jdbc.query(
                "SELECT id FROM ingredients WHERE display_order BETWEEN ? AND ? ORDER BY display_order",
                (resultSet, rowNumber) -> resultSet.getString("id"),
                first,
                last
        );
    }

    private void assertEveryCoreIngredientHasRows(String table, int minimumRows) {
        List<String> missing = jdbc.query("""
                SELECT ingredient.id
                FROM ingredients ingredient
                LEFT JOIN %s detail ON detail.ingredient_id = ingredient.id
                WHERE ingredient.display_order BETWEEN 12 AND 31
                GROUP BY ingredient.id
                HAVING COUNT(detail.ingredient_id) < ?
                ORDER BY ingredient.id
                """.formatted(table), (resultSet, rowNumber) -> resultSet.getString("id"), minimumRows);
        assertThat(missing).as("core ingredients missing rows in %s", table).isEmpty();
    }

    private Map<String, Long> dictionaryTableCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("ingredients", count("SELECT COUNT(*) FROM ingredients"));
        counts.put("tags", count("SELECT COUNT(*) FROM ingredient_tags"));
        counts.put("skinTypes", count("SELECT COUNT(*) FROM ingredient_skin_type_features"));
        counts.put("concerns", count("SELECT COUNT(*) FROM ingredient_concern_features"));
        counts.put("references", count("SELECT COUNT(*) FROM cosmetic_ingredient_references"));
        counts.put("aliases", count("SELECT COUNT(*) FROM cosmetic_ingredient_aliases"));
        return counts;
    }

    private long count(String sql) {
        Long value = jdbc.queryForObject(sql, Long.class);
        return value == null ? 0L : value;
    }

    private JsonNode getJson(HttpClient client, String path) throws Exception {
        HttpResponse<String> response = client.send(
                HttpRequest.newBuilder()
                        .uri(URI.create("http://localhost:" + port + path))
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
        );
        assertThat(response.statusCode()).as(path).isEqualTo(200);
        return objectMapper.readTree(response.body());
    }
}

package com.hwaryeok;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.hwaryeok.product.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class HwaryeokApplicationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private ProductRepository productRepository;

    @Test
    void loadsApplicationAndSeedsProducts() {
        assertThat(productRepository.count()).isEqualTo(6);
    }

    @Test
    void servesProductSearchApi() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/products?query=자작나무&grade=1"))
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("birch-cream", "자작나무 수분 크림", "\"grade\":1");
    }

    @Test
    void servesProductDetailAndSkinRankingApis() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest detailRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/products/birch-cream"))
                .GET()
                .build();
        HttpRequest rankingRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/products/ranking?skinType=%EB%AF%BC%EA%B0%90&limit=3"))
                .GET()
                .build();

        HttpResponse<String> detailResponse = client.send(detailRequest, HttpResponse.BodyHandlers.ofString());
        HttpResponse<String> rankingResponse = client.send(rankingRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(detailResponse.statusCode()).isEqualTo(200);
        assertThat(detailResponse.body()).contains("birch-cream", "수분 장벽 강화");
        assertThat(rankingResponse.statusCode()).isEqualTo(200);
        assertThat(rankingResponse.body()).contains("birch-cream", "heartleaf-toner", "ceramide-serum");
        assertThat(rankingResponse.body()).doesNotContain("mugwort-ampoule");
    }

    @Test
    void servesPersonalAnalysisApi() throws Exception {
        String payload = """
                {
                  "productId": "birch-cream",
                  "skinType": "수부지",
                  "concerns": ["속건조", "민감", "피부 장벽"]
                }
                """;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/analyses/preview"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"grade\":1", "\"score\":100", "매우 잘 맞아요");
    }

    @Test
    void servesIngredientSearchAndDetailApis() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest searchRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/ingredients?query=%ED%8C%90%ED%85%8C%EB%86%80&status=GOOD&page=0&size=5"))
                .GET()
                .build();
        HttpRequest detailRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/ingredients/panthenol"))
                .GET()
                .build();

        HttpResponse<String> searchResponse = client.send(searchRequest, HttpResponse.BodyHandlers.ofString());
        HttpResponse<String> detailResponse = client.send(detailRequest, HttpResponse.BodyHandlers.ofString());

        assertThat(searchResponse.statusCode()).isEqualTo(200);
        assertThat(searchResponse.body()).contains("\"totalElements\":1", "판테놀", "\"status\":\"GOOD\"");
        assertThat(detailResponse.statusCode()).isEqualTo(200);
        assertThat(detailResponse.body()).contains("Panthenol", "skinTypeFeatures", "concernFeatures", "birch-cream");
    }

    @Test
    void servesFilteredProductIngredientsApi() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/products/birch-cream/ingredients?tag=%EC%9E%A5%EB%B2%BD"))
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"totalCount\":4", "판테놀", "\"goodCount\":3", "\"cautionCount\":1");
        assertThat(response.body()).doesNotContain("자작나무 수액", "시어버터");
    }
}

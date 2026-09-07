package com.hwaryeok.ranking;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RisingRankingHttpTest {

    @LocalServerPort private int port;
    private final HttpClient client = HttpClient.newHttpClient();

    @Test
    void exposesPublicRankingWithItsActualWindowAndRejectsInvalidInputs() throws Exception {
        var response = get("/api/v1/rankings/rising");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"content\":", "\"categories\":", "\"window\":", "\"days\":7", "\"scoreBasis\":")
                .doesNotContain("password", "email");
        assertThat(get("/api/v1/rankings/rising?page=-1").statusCode()).isEqualTo(400);
        assertThat(get("/api/v1/rankings/rising?size=51").statusCode()).isEqualTo(400);
        assertThat(get("/api/v1/rankings/rising?page=2147483647&size=50").statusCode()).isEqualTo(200);
    }

    private HttpResponse<String> get(String path) throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build(),
                HttpResponse.BodyHandlers.ofString());
    }
}

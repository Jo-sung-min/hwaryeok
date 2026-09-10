package com.hwaryeok.review;

import static com.hwaryeok.review.ReviewerProfileDtos.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:reviewer-profile-service;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@ExtendWith(OutputCaptureExtension.class)
class ReviewerProfileServiceTest {

    @Autowired private ReviewerProfileService service;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private ObjectMapper mapper;

    private String userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID().toString();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, role, status)
                VALUES (?, ?, 'unused', '서비스 테스트 리뷰어', 'USER', 'ACTIVE')
                """, userId, userId + "@example.com");
    }

    @AfterEach
    void cleanUp() {
        jdbc.update("DELETE FROM users WHERE id = ?", userId);
    }

    @Test
    void acceptsOnlyTheTextFocusedBlockNoteSchema() throws Exception {
        JsonNode allowed = mapper.readTree("""
                [
                  {"id":"p","type":"paragraph","props":{"textColor":"rgb(12, 34, 56)","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"문단","styles":{"bold":true,"backgroundColor":"#f4dfeb"}}],"children":[]},
                  {"id":"h","type":"heading","props":{"level":2,"isToggleable":false,"textColor":"#abc"},"content":"제목","children":[]},
                  {"id":"b","type":"bulletListItem","props":{},"content":"목록","children":[]},
                  {"id":"n","type":"numberedListItem","props":{"start":1},"content":"번호","children":[]},
                  {"id":"c","type":"checkListItem","props":{"checked":true},"content":"체크","children":[]},
                  {"id":"q","type":"quote","props":{"textColor":"hsl(320, 55%, 45%)"},"content":"인용","children":[]},
                  {"id":"code","type":"codeBlock","props":{"language":"text"},"content":[{"type":"text","text":"const value = 1;","styles":{}}],"children":[]},
                  {"id":"d","type":"divider","props":{},"children":[]},
                  {"id":"t","type":"toggleListItem","props":{},"content":[{"type":"text","text":"접기 목록","styles":{}}],"children":[]}
                ]
                """);

        var saved = service.save(userId, new UpdateRequest(allowed, null, null));

        assertThat(saved.bioBlocks()).hasSize(9);
        assertThat(saved.bioBlocks().get(8).get("type").asString()).isEqualTo("toggleListItem");
    }

    @Test
    void rejectsMediaUnknownShapesUnsafeStylesAndUnsafeLinks() throws Exception {
        for (String type : List.of("image", "audio", "video", "file", "table", "unknown")) {
            JsonNode document = mapper.readTree("[{\"type\":\"" + type + "\",\"props\":{},\"children\":[]}]");
            assertThatThrownBy(() -> service.save(userId, new UpdateRequest(document, null, null)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("텍스트 블록");
        }

        for (String json : List.of(
                "[{\"type\":\"paragraph\",\"props\":{\"url\":\"https://tracker.example\"},\"content\":[],\"children\":[]}]",
                "[{\"type\":\"paragraph\",\"props\":{},\"content\":[{\"type\":\"text\",\"text\":\"글\",\"styles\":{\"onload\":true}}],\"children\":[]}]",
                "[{\"type\":\"paragraph\",\"props\":{\"textColor\":\"url(javascript:alert(1))\"},\"content\":[],\"children\":[]}]",
                "[{\"type\":\"paragraph\",\"props\":{},\"content\":[{\"type\":\"link\",\"href\":\"javascript:alert(1)\",\"content\":\"링크\"}],\"children\":[]}]",
                "[{\"type\":\"codeBlock\",\"props\":{\"language\":\"text\"},\"content\":[{\"type\":\"text\",\"text\":\"code\",\"styles\":{\"bold\":true}}],\"children\":[]}]",
                "[{\"type\":\"paragraph\",\"props\":{},\"content\":[],\"children\":{},\"unexpected\":true}]"
        )) {
            JsonNode document = mapper.readTree(json);
            assertThatThrownBy(() -> service.save(userId, new UpdateRequest(document, null, null)))
                    .isInstanceOf(IllegalArgumentException.class);
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reviewer_profiles WHERE user_id = ?", Integer.class, userId))
                .isZero();
    }

    @Test
    void corruptedStoredJsonFallsBackToEmptyForOwnerAndPublicReads(CapturedOutput output) {
        jdbc.update("""
                INSERT INTO reviewer_profiles (user_id, introduction_json, blog_url, instagram_url)
                VALUES (?, '{', 'https://example.com/blog', 'https://www.instagram.com/hwaryeok')
                """, userId);

        var mine = service.mine(userId);
        var publicProfile = service.publicProfile(new ReviewerProfileResponse(
                userId, "서비스 테스트 리뷰어", null, null, null, 0, 0, 0, null, null
        ));

        assertThat(mine.bioBlocks()).isEmpty();
        assertThat(publicProfile.bioBlocks()).isEmpty();
        assertThat(mine.blogUrl()).isEqualTo("https://example.com/blog");
        assertThat(output).contains("Ignoring invalid reviewer profile bioBlocks for user " + userId);
    }

    @Test
    void concurrentFirstSavesSerializeOnTheUserRowAndLeaveOneProfile() throws Exception {
        UpdateRequest firstRequest = new UpdateRequest(mapper.readTree("[{\"id\":\"one\",\"type\":\"paragraph\",\"props\":{},\"content\":\"첫 소개\",\"children\":[]}]"),
                "https://example.com/first", null);
        UpdateRequest secondRequest = new UpdateRequest(mapper.readTree("[{\"id\":\"two\",\"type\":\"quote\",\"props\":{},\"content\":\"두 번째 소개\",\"children\":[]}]"),
                "https://example.com/second", null);

        try (var executor = Executors.newFixedThreadPool(2)) {
            var barrier = new CyclicBarrier(2);
            var first = executor.submit(() -> {
                barrier.await();
                return service.save(userId, firstRequest);
            });
            var second = executor.submit(() -> {
                barrier.await();
                return service.save(userId, secondRequest);
            });

            assertThat(first.get(20, TimeUnit.SECONDS).userId()).isEqualTo(userId);
            assertThat(second.get(20, TimeUnit.SECONDS).userId()).isEqualTo(userId);
        }

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM reviewer_profiles WHERE user_id = ?", Integer.class, userId))
                .isEqualTo(1);
        assertThat(service.mine(userId).blogUrl())
                .isIn("https://example.com/first", "https://example.com/second");
    }
}

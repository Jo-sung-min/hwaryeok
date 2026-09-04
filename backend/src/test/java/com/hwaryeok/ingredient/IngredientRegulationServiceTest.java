package com.hwaryeok.ingredient;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class IngredientRegulationServiceTest {

    private static final String SOURCE_RECORD_ID = "test-panthenol-regulation";
    private static final String REVIEWER_ID = "test-ingredient-regulation-reviewer";

    @Autowired
    private IngredientRegulationService service;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void setUp() {
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, role, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVE', ?, ?)
                """,
                REVIEWER_ID,
                "ingredient-regulation-reviewer@example.com",
                "not-used-in-this-test",
                "성분규제검수자",
                Instant.now(),
                Instant.now()
        );
        jdbc.update("""
                INSERT INTO mfds_ingredient_regulations (
                    source_record_id, standard_name, normalized_name, english_name, cas_no,
                    restriction_type, restriction_text, proviso, source_url, collected_at, raw_payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                SOURCE_RECORD_ID,
                "판테놀",
                "판테놀",
                "Panthenol",
                "81-13-0",
                "한도",
                "헤어 제품에는 5% 이하로 사용",
                "사용 후 씻어내는 제품에 한함",
                "https://apis.data.go.kr/example",
                Instant.now(),
                "{\"COUNTRY_NAME\":\"대한민국\",\"NOTICE_INGR_NAME\":\"D-판테놀\"}"
        );
    }

    @Test
    void publishesOnlyAnAdminVerifiedIngredientRegulation() {
        var candidates = service.findCandidates("panthenol", "판테놀", 10);

        assertThat(candidates)
                .filteredOn(candidate -> SOURCE_RECORD_ID.equals(candidate.sourceRecordId()))
                .singleElement()
                .satisfies(candidate -> {
                    assertThat(candidate.confidence()).isEqualTo(100);
                    assertThat(candidate.country()).isEqualTo("대한민국");
                    assertThat(candidate.verified()).isFalse();
                });
        assertThat(service.findVerified("panthenol"))
                .noneMatch(regulation -> SOURCE_RECORD_ID.equals(regulation.sourceRecordId()));

        var review = service.verify("panthenol", SOURCE_RECORD_ID, REVIEWER_ID, "표준명과 CAS No 확인");

        assertThat(review.reviewerNickname()).isEqualTo("성분규제검수자");
        assertThat(review.reviewNote()).contains("CAS No");
        assertThat(service.findVerified("panthenol"))
                .filteredOn(regulation -> SOURCE_RECORD_ID.equals(regulation.sourceRecordId()))
                .singleElement()
                .satisfies(regulation -> {
                    assertThat(regulation.country()).isEqualTo("대한민국");
                    assertThat(regulation.restrictionType()).isEqualTo("한도");
                    assertThat(regulation.sourceUrl()).isEqualTo("https://www.data.go.kr/data/15111772/openapi.do");
                    assertThat(regulation.disclaimer()).contains("단정할 수 없습니다");
                });
    }

    @Test
    void removesAReviewedRegulationFromThePublicResponse() {
        service.verify("panthenol", SOURCE_RECORD_ID, REVIEWER_ID, null);

        service.remove("panthenol", SOURCE_RECORD_ID);

        assertThat(service.findVerified("panthenol"))
                .noneMatch(regulation -> SOURCE_RECORD_ID.equals(regulation.sourceRecordId()));
    }
}

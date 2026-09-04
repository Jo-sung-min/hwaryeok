package com.hwaryeok.datasource;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class MfdsProductMatchServiceTest {

    private static final String REPORT_ID = "test-mfds-report-1";
    private static final String REVIEWER_ID = "test-mfds-reviewer";

    @Autowired
    private MfdsProductMatchService service;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void setUp() {
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, nickname, role, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVE', ?, ?)
                """,
                REVIEWER_ID,
                "mfds-reviewer@example.com",
                "not-used-in-this-test",
                "식약처검수자",
                Instant.now(),
                Instant.now()
        );
        jdbc.update("""
                INSERT INTO mfds_cosmetic_products (
                    report_id, product_name, normalized_product_name, company_name,
                    manufacturer_name, functional_types, report_date, source_url, collected_at, raw_payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                REPORT_ID,
                "조선미녀 맑은 쌀 선크림",
                CosmeticDataPipelineService.normalizeName("조선미녀 맑은 쌀 선크림"),
                "구다이글로벌",
                "한국콜마",
                "자외선 차단 보고",
                LocalDate.of(2025, 3, 18),
                "https://apis.data.go.kr/example",
                Instant.now(),
                "{}"
        );
    }

    @Test
    void searchesCandidateAndPublishesOnlyAdminVerifiedMatch() {
        var candidates = service.findCandidates("rice-sunscreen", "맑은 쌀 선크림", 5);

        assertThat(candidates).singleElement().satisfies(candidate -> {
            assertThat(candidate.reportId()).isEqualTo(REPORT_ID);
            assertThat(candidate.confidence()).isGreaterThanOrEqualTo(90);
            assertThat(candidate.currentlyMatched()).isFalse();
        });
        assertThat(service.findPublicSource("rice-sunscreen").matched()).isFalse();

        var saved = service.saveVerifiedMatch(
                "rice-sunscreen",
                REPORT_ID,
                REVIEWER_ID,
                "제품명과 책임판매업체를 확인함"
        );

        assertThat(saved.matchStatus()).isEqualTo("ADMIN_VERIFIED");
        assertThat(saved.reviewerNickname()).isEqualTo("식약처검수자");
        assertThat(saved.reviewNote()).contains("책임판매업체");
        ProductRegulatorySourceResponse publicSource = service.findPublicSource("rice-sunscreen");
        assertThat(publicSource.matched()).isTrue();
        assertThat(publicSource.label()).isEqualTo("식약처 보고정보 확인");
        assertThat(publicSource.disclaimer()).contains("안전성을 보장하지 않습니다");
    }

    @Test
    void removesVerifiedMatchFromPublicSource() {
        service.saveVerifiedMatch("rice-sunscreen", REPORT_ID, REVIEWER_ID, null);

        service.removeVerifiedMatch("rice-sunscreen");

        assertThat(service.findPublicSource("rice-sunscreen").matched()).isFalse();
    }
}


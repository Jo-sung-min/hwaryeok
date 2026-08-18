package com.hwaryeok.expert;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import com.hwaryeok.common.error.ForbiddenOperationException;
import com.hwaryeok.common.error.ResourceNotFoundException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpertService {

    private static final String RANKING_DISCLAIMER =
            "이 순위는 화력 플랫폼 내 답변 수, 도움돼요, 저장, 채택 활동을 바탕으로 합니다. 의료진의 의학적 실력이나 치료 결과를 평가하지 않습니다.";

    private final JdbcTemplate jdbc;

    public ExpertService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<ExpertSummaryResponse> findExperts(String topic) {
        String normalizedTopic = normalizeTopic(topic);
        String topicFilter = normalizedTopic == null ? "" : """
                  AND EXISTS (
                    SELECT 1 FROM expert_topic_maps etm
                    JOIN expert_topics et ON et.id = etm.topic_id
                    WHERE etm.expert_id = e.id AND et.code = ?
                  )
                """;
        String sql = """
                SELECT e.*
                FROM experts e
                WHERE e.status = 'VERIFIED' AND e.doctor_verified = TRUE
                """ + topicFilter + """
                ORDER BY e.specialist_verified DESC, e.workplace_verified DESC, e.real_name
                """;
        if (normalizedTopic == null) {
            return jdbc.query(sql, (rs, rowNum) -> toSummary(readExpert(rs)));
        }
        return jdbc.query(sql, (rs, rowNum) -> toSummary(readExpert(rs)), normalizedTopic);
    }

    public ExpertDetailResponse findExpert(String slug) {
        ExpertRow expert = findExpertRowBySlug(slug);
        if (!"VERIFIED".equals(expert.status()) || !expert.doctorVerified()) {
            throw new ResourceNotFoundException("확인할 수 없는 전문가예요.");
        }
        return new ExpertDetailResponse(toSummary(expert), findRecentAnswers(expert.id(), 6));
    }

    public ExpertRankingResponse rankings(String period, String topic) {
        String normalizedPeriod = normalizePeriod(period);
        String normalizedTopic = normalizeTopic(topic);
        Instant since = rankingSince(normalizedPeriod);
        List<RankingDraft> drafts = new ArrayList<>();
        for (ExpertSummaryResponse expert : findExperts(normalizedTopic)) {
            ExpertStatsResponse stats = stats(expert.id(), since);
            int score = stats.answerCount() * 12
                    + stats.helpfulCount() * 3
                    + stats.saveCount() * 2
                    + stats.adoptedCount() * 10;
            drafts.add(new RankingDraft(expert, score, stats));
        }
        drafts.sort(Comparator.comparingInt(RankingDraft::score).reversed()
                .thenComparing(draft -> draft.expert().realName()));
        List<ExpertRankingItemResponse> content = new ArrayList<>();
        for (int index = 0; index < drafts.size(); index++) {
            RankingDraft draft = drafts.get(index);
            content.add(new ExpertRankingItemResponse(index + 1, draft.expert(), draft.score(), draft.stats()));
        }
        return new ExpertRankingResponse(normalizedPeriod, normalizedTopic, RANKING_DISCLAIMER, content);
    }

    public List<ExpertQuestionListItemResponse> findQuestions(String status) {
        String normalizedStatus = normalizeQuestionStatus(status);
        String statusFilter = normalizedStatus == null ? "" : "\nWHERE q.status = ?\n";
        String sql = """
                SELECT q.id, q.author_nickname, q.title, q.skin_type, q.ingredient_id,
                       i.name AS ingredient_name, q.status, q.created_at,
                       (SELECT COUNT(*) FROM expert_answers a
                        WHERE a.question_id = q.id AND a.status = 'PUBLISHED') AS answer_count
                FROM expert_questions q
                LEFT JOIN ingredients i ON i.id = q.ingredient_id
                """ + statusFilter + """
                ORDER BY q.created_at DESC, q.id
                """;
        var rowMapper = (org.springframework.jdbc.core.RowMapper<ExpertQuestionListItemResponse>) (rs, rowNum) -> new ExpertQuestionListItemResponse(
                rs.getString("id"), rs.getString("author_nickname"), rs.getString("title"),
                rs.getString("skin_type"), rs.getString("ingredient_id"), rs.getString("ingredient_name"),
                rs.getString("status"), rs.getInt("answer_count"), instant(rs, "created_at")
        );
        if (normalizedStatus == null) return jdbc.query(sql, rowMapper);
        return jdbc.query(sql, rowMapper, normalizedStatus);
    }

    public ExpertQuestionDetailResponse findQuestion(String questionId, String viewerUserId) {
        String sql = """
                SELECT q.*, i.name AS ingredient_name
                FROM expert_questions q
                LEFT JOIN ingredients i ON i.id = q.ingredient_id
                WHERE q.id = ?
                """;
        List<ExpertQuestionDetailResponse> results = jdbc.query(sql, (rs, rowNum) ->
                new ExpertQuestionDetailResponse(
                        rs.getString("id"), rs.getString("author_nickname"), rs.getString("title"),
                        rs.getString("content"), rs.getString("skin_type"), rs.getString("ingredient_id"),
                        rs.getString("ingredient_name"), rs.getString("status"),
                        viewerUserId != null && viewerUserId.equals(rs.getString("user_id")),
                        instant(rs, "created_at"), findAnswers(questionId, viewerUserId)
                ), questionId);
        if (results.isEmpty()) throw new ResourceNotFoundException("질문을 찾을 수 없어요.");
        return results.getFirst();
    }

    @Transactional
    public ExpertQuestionDetailResponse createQuestion(String userId, ExpertQuestionRequest request) {
        requireUser(userId);
        String ingredientId = blankToNull(request.ingredientId());
        if (ingredientId != null && count("SELECT COUNT(*) FROM ingredients WHERE id = ?", ingredientId) == 0) {
            throw new IllegalArgumentException("선택한 성분을 찾을 수 없어요.");
        }
        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        jdbc.update("""
                INSERT INTO expert_questions
                    (id, user_id, author_nickname, title, content, skin_type, ingredient_id, status, created_at, updated_at)
                SELECT ?, u.id, u.nickname, ?, ?, ?, ?, 'OPEN', ?, ? FROM users u WHERE u.id = ?
                """, id, request.title().trim(), request.content().trim(), blankToNull(request.skinType()),
                ingredientId, now, now, userId);
        return findQuestion(id, userId);
    }

    @Transactional
    public ExpertAnswerResponse createAnswer(String userId, String questionId, ExpertAnswerRequest request) {
        ExpertRow expert = findVerifiedExpertByUser(userId);
        if (count("SELECT COUNT(*) FROM expert_questions WHERE id = ?", questionId) == 0) {
            throw new ResourceNotFoundException("질문을 찾을 수 없어요.");
        }
        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        jdbc.update("""
                INSERT INTO expert_answers
                    (id, expert_id, question_id, content, status, helpful_count, save_count, adopted, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'PUBLISHED', 0, 0, FALSE, ?, ?)
                """, id, expert.id(), questionId, request.content().trim(), now, now);
        jdbc.update("UPDATE expert_questions SET status = 'ANSWERED', updated_at = ? WHERE id = ?", now, questionId);
        jdbc.update("""
                UPDATE expert_topic_maps SET answer_count = answer_count + 1, activity_score = activity_score + 12
                WHERE expert_id = ?
                """, expert.id());
        return findAnswer(id, userId);
    }

    @Transactional
    public ExpertEngagementResponse setHelpful(String userId, String answerId, boolean selected) {
        requireUser(userId);
        requireAnswer(answerId);
        boolean exists = reactionExists("expert_answer_helpfuls", userId, answerId);
        if (selected && !exists) {
            try {
                jdbc.update("INSERT INTO expert_answer_helpfuls (user_id, answer_id, created_at) VALUES (?, ?, ?)",
                        userId, answerId, Instant.now());
                jdbc.update("UPDATE expert_answers SET helpful_count = helpful_count + 1 WHERE id = ?", answerId);
            } catch (DuplicateKeyException ignored) {
                // 같은 요청이 동시에 도착해도 한 번만 반영합니다.
            }
        } else if (!selected && exists) {
            jdbc.update("DELETE FROM expert_answer_helpfuls WHERE user_id = ? AND answer_id = ?", userId, answerId);
            jdbc.update("UPDATE expert_answers SET helpful_count = CASE WHEN helpful_count > 0 THEN helpful_count - 1 ELSE 0 END WHERE id = ?", answerId);
        }
        return engagement(answerId, userId);
    }

    @Transactional
    public ExpertEngagementResponse setSaved(String userId, String answerId, boolean selected) {
        requireUser(userId);
        requireAnswer(answerId);
        boolean exists = reactionExists("expert_answer_saves", userId, answerId);
        if (selected && !exists) {
            try {
                jdbc.update("INSERT INTO expert_answer_saves (user_id, answer_id, created_at) VALUES (?, ?, ?)",
                        userId, answerId, Instant.now());
                jdbc.update("UPDATE expert_answers SET save_count = save_count + 1 WHERE id = ?", answerId);
            } catch (DuplicateKeyException ignored) {
                // 같은 요청이 동시에 도착해도 한 번만 반영합니다.
            }
        } else if (!selected && exists) {
            jdbc.update("DELETE FROM expert_answer_saves WHERE user_id = ? AND answer_id = ?", userId, answerId);
            jdbc.update("UPDATE expert_answers SET save_count = CASE WHEN save_count > 0 THEN save_count - 1 ELSE 0 END WHERE id = ?", answerId);
        }
        return engagement(answerId, userId);
    }

    @Transactional
    public ExpertEngagementResponse adopt(String userId, String questionId, String answerId) {
        String ownerId = jdbc.query("SELECT user_id FROM expert_questions WHERE id = ?", rs -> rs.next() ? rs.getString(1) : null, questionId);
        if (ownerId == null) throw new ResourceNotFoundException("질문을 찾을 수 없거나 샘플 질문은 채택할 수 없어요.");
        if (!ownerId.equals(userId)) throw new ForbiddenOperationException("질문을 작성한 회원만 답변을 채택할 수 있어요.");
        if (count("SELECT COUNT(*) FROM expert_answers WHERE id = ? AND question_id = ? AND status = 'PUBLISHED'", answerId, questionId) == 0) {
            throw new ResourceNotFoundException("이 질문의 답변을 찾을 수 없어요.");
        }
        jdbc.update("UPDATE expert_answers SET adopted = FALSE, updated_at = ? WHERE question_id = ?", Instant.now(), questionId);
        jdbc.update("UPDATE expert_answers SET adopted = TRUE, updated_at = ? WHERE id = ?", Instant.now(), answerId);
        return engagement(answerId, userId);
    }

    public ExpertApplicationResponse findMyApplication(String userId) {
        List<ExpertRow> experts = jdbc.query("SELECT * FROM experts WHERE user_id = ?", (rs, rowNum) -> readExpert(rs), userId);
        if (experts.isEmpty()) throw new ResourceNotFoundException("전문가 인증 신청 내역이 없어요.");
        return toApplication(experts.getFirst());
    }

    @Transactional
    public ExpertApplicationResponse apply(String userId, ExpertApplicationRequest request) {
        requireUser(userId);
        if (request.specialistRequested() && blankToNull(request.specialty()) == null) {
            throw new IllegalArgumentException("전문의 인증을 신청하려면 전문 과목을 입력해 주세요.");
        }
        validateTopics(request.topics());
        String existingId = jdbc.query("SELECT id FROM experts WHERE user_id = ?", rs -> rs.next() ? rs.getString(1) : null, userId);
        String id = existingId == null ? UUID.randomUUID().toString() : existingId;
        Instant now = Instant.now();
        String licenseHash = hashLicense(request.licenseNumber());
        if (count("SELECT COUNT(*) FROM experts WHERE license_number_hash = ? AND id <> ?", licenseHash, id) > 0) {
            throw new IllegalArgumentException("이미 다른 계정에서 등록한 면허번호예요.");
        }
        if (existingId == null) {
            jdbc.update("""
                    INSERT INTO experts
                        (id, slug, user_id, real_name, license_number_hash, doctor_verified, specialist_verified,
                         specialty, workplace_verified, bio, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, FALSE, FALSE, ?, FALSE, ?, 'PENDING', ?, ?)
                    """, id, "applicant-" + id, userId, request.realName().trim(), licenseHash,
                    blankToNull(request.specialty()), request.bio().trim(), now, now);
        } else {
            ExpertRow existing = findExpertRowById(id);
            if ("VERIFIED".equals(existing.status()) || "SUSPENDED".equals(existing.status())) {
                throw new IllegalArgumentException("현재 인증 상태에서는 신청서를 다시 제출할 수 없어요.");
            }
            jdbc.update("""
                    UPDATE experts SET real_name = ?, license_number_hash = ?, specialty = ?, bio = ?,
                        status = 'PENDING', doctor_verified = FALSE, doctor_verified_at = NULL,
                        specialist_verified = FALSE, workplace_verified = FALSE, workplace_verified_at = NULL,
                        updated_at = ? WHERE id = ?
                    """, request.realName().trim(), licenseHash, blankToNull(request.specialty()),
                    request.bio().trim(), now, id);
            jdbc.update("DELETE FROM expert_topic_maps WHERE expert_id = ?", id);
            jdbc.update("DELETE FROM expert_workplaces WHERE expert_id = ?", id);
        }
        for (String topic : request.topics().stream().distinct().toList()) {
            jdbc.update("""
                    INSERT INTO expert_topic_maps (expert_id, topic_id, self_selected, activity_score, answer_count, helpful_count)
                    SELECT ?, id, TRUE, 0, 0, 0 FROM expert_topics WHERE code = ?
                    """, id, topic);
        }
        ExpertWorkplaceRequest workplace = request.workplace();
        jdbc.update("""
                INSERT INTO expert_workplaces
                    (id, expert_id, hospital_name, region, address, phone, homepage_url, is_current, verified, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, FALSE, ?)
                """, UUID.randomUUID().toString(), id, workplace.hospitalName().trim(), workplace.region().trim(),
                workplace.address().trim(), blankToNull(workplace.phone()), blankToNull(workplace.homepageUrl()), now);
        return toApplication(findExpertRowById(id));
    }

    public List<ExpertApplicationResponse> findApplications() {
        return jdbc.query("SELECT * FROM experts WHERE user_id IS NOT NULL ORDER BY created_at DESC",
                (rs, rowNum) -> toApplication(readExpert(rs)));
    }

    @Transactional
    public ExpertApplicationResponse verify(String expertId, ExpertVerificationRequest request) {
        ExpertRow expert = findExpertRowById(expertId);
        if ("VERIFIED".equals(request.status()) && !request.doctorVerified()) {
            throw new IllegalArgumentException("의사 인증이 완료되어야 승인할 수 있어요.");
        }
        if (request.specialistVerified() && expert.specialty() == null) {
            throw new IllegalArgumentException("전문 과목이 입력된 신청서만 전문의 인증을 승인할 수 있어요.");
        }
        Instant now = Instant.now();
        boolean verified = "VERIFIED".equals(request.status());
        jdbc.update("""
                UPDATE experts SET status = ?, doctor_verified = ?, doctor_verified_at = ?,
                    specialist_verified = ?, workplace_verified = ?, workplace_verified_at = ?, updated_at = ?
                WHERE id = ?
                """, request.status(), verified && request.doctorVerified(),
                verified && request.doctorVerified() ? now : null,
                verified && request.specialistVerified(), verified && request.workplaceVerified(),
                verified && request.workplaceVerified() ? now : null, now, expert.id());
        jdbc.update("UPDATE expert_workplaces SET verified = ?, verified_at = ? WHERE expert_id = ? AND is_current = TRUE",
                verified && request.workplaceVerified(), verified && request.workplaceVerified() ? now : null, expert.id());
        return toApplication(findExpertRowById(expert.id()));
    }

    private List<ExpertAnswerResponse> findRecentAnswers(String expertId, int limit) {
        String sql = """
                SELECT * FROM expert_answers
                WHERE expert_id = ? AND status = 'PUBLISHED'
                ORDER BY created_at DESC, id LIMIT ?
                """;
        return jdbc.query(sql, (rs, rowNum) -> mapAnswer(rs, null), expertId, limit);
    }

    private List<ExpertAnswerResponse> findAnswers(String questionId, String viewerUserId) {
        return jdbc.query("""
                SELECT * FROM expert_answers WHERE question_id = ? AND status = 'PUBLISHED'
                ORDER BY adopted DESC, helpful_count DESC, created_at ASC
                """, (rs, rowNum) -> mapAnswer(rs, viewerUserId), questionId);
    }

    private ExpertAnswerResponse findAnswer(String answerId, String viewerUserId) {
        List<ExpertAnswerResponse> answers = jdbc.query("SELECT * FROM expert_answers WHERE id = ?",
                (rs, rowNum) -> mapAnswer(rs, viewerUserId), answerId);
        if (answers.isEmpty()) throw new ResourceNotFoundException("답변을 찾을 수 없어요.");
        return answers.getFirst();
    }

    private ExpertAnswerResponse mapAnswer(ResultSet rs, String viewerUserId) throws SQLException {
        String id = rs.getString("id");
        return new ExpertAnswerResponse(
                id, toSummary(findExpertRowById(rs.getString("expert_id"))), rs.getString("content"),
                rs.getInt("helpful_count"), rs.getInt("save_count"), rs.getBoolean("adopted"),
                viewerUserId != null && reactionExists("expert_answer_helpfuls", viewerUserId, id),
                viewerUserId != null && reactionExists("expert_answer_saves", viewerUserId, id),
                instant(rs, "created_at")
        );
    }

    private ExpertSummaryResponse toSummary(ExpertRow expert) {
        return new ExpertSummaryResponse(
                expert.id(), expert.slug(), expert.realName(), verificationLabel(expert),
                expert.doctorVerified(), expert.specialistVerified(), expert.specialty(),
                expert.workplaceVerified(), expert.profileImageUrl(), expert.bio(), topics(expert.id()),
                workplace(expert.id()), stats(expert.id(), null)
        );
    }

    private ExpertApplicationResponse toApplication(ExpertRow expert) {
        return new ExpertApplicationResponse(
                expert.id(), expert.realName(), expert.status(), expert.specialty() != null,
                expert.specialty(), topics(expert.id()), workplace(expert.id()), expert.createdAt(), expert.updatedAt()
        );
    }

    private List<ExpertTopicResponse> topics(String expertId) {
        return jdbc.query("""
                SELECT t.code, t.name FROM expert_topic_maps m
                JOIN expert_topics t ON t.id = m.topic_id
                WHERE m.expert_id = ? ORDER BY m.activity_score DESC, t.name
                """, (rs, rowNum) -> new ExpertTopicResponse(rs.getString("code"), rs.getString("name")), expertId);
    }

    private ExpertWorkplaceResponse workplace(String expertId) {
        List<ExpertWorkplaceResponse> results = jdbc.query("""
                SELECT * FROM expert_workplaces WHERE expert_id = ? AND is_current = TRUE
                ORDER BY created_at DESC LIMIT 1
                """, (rs, rowNum) -> new ExpertWorkplaceResponse(
                rs.getString("hospital_name"), rs.getString("region"), rs.getString("address"),
                rs.getString("phone"), rs.getString("homepage_url"), rs.getBoolean("verified")
        ), expertId);
        return results.isEmpty() ? null : results.getFirst();
    }

    private ExpertStatsResponse stats(String expertId, Instant since) {
        String timeFilter = since == null ? "" : " AND created_at >= ?";
        Object[] args = since == null ? new Object[]{expertId} : new Object[]{expertId, Timestamp.from(since)};
        return jdbc.queryForObject("""
                SELECT COUNT(*) AS answer_count,
                       COALESCE(SUM(helpful_count), 0) AS helpful_count,
                       COALESCE(SUM(save_count), 0) AS save_count,
                       COALESCE(SUM(CASE WHEN adopted THEN 1 ELSE 0 END), 0) AS adopted_count
                FROM expert_answers WHERE expert_id = ? AND status = 'PUBLISHED'
                """ + timeFilter, (rs, rowNum) -> new ExpertStatsResponse(
                rs.getInt("answer_count"), rs.getInt("helpful_count"),
                rs.getInt("save_count"), rs.getInt("adopted_count")
        ), args);
    }

    private ExpertEngagementResponse engagement(String answerId, String userId) {
        return jdbc.queryForObject("""
                SELECT id, helpful_count, save_count, adopted FROM expert_answers WHERE id = ?
                """, (rs, rowNum) -> new ExpertEngagementResponse(
                rs.getString("id"), rs.getInt("helpful_count"), rs.getInt("save_count"),
                reactionExists("expert_answer_helpfuls", userId, answerId),
                reactionExists("expert_answer_saves", userId, answerId), rs.getBoolean("adopted")
        ), answerId);
    }

    private ExpertRow findExpertRowBySlug(String slug) {
        List<ExpertRow> results = jdbc.query("SELECT * FROM experts WHERE slug = ?", (rs, rowNum) -> readExpert(rs), slug);
        if (results.isEmpty()) throw new ResourceNotFoundException("전문가를 찾을 수 없어요.");
        return results.getFirst();
    }

    private ExpertRow findExpertRowById(String id) {
        List<ExpertRow> results = jdbc.query("SELECT * FROM experts WHERE id = ?", (rs, rowNum) -> readExpert(rs), id);
        if (results.isEmpty()) throw new ResourceNotFoundException("전문가를 찾을 수 없어요.");
        return results.getFirst();
    }

    private ExpertRow findVerifiedExpertByUser(String userId) {
        List<ExpertRow> results = jdbc.query("""
                SELECT * FROM experts WHERE user_id = ? AND status = 'VERIFIED' AND doctor_verified = TRUE
                """, (rs, rowNum) -> readExpert(rs), userId);
        if (results.isEmpty()) throw new ForbiddenOperationException("의사 인증이 완료된 전문가만 답변할 수 있어요.");
        return results.getFirst();
    }

    private ExpertRow readExpert(ResultSet rs) throws SQLException {
        return new ExpertRow(
                rs.getString("id"), rs.getString("slug"), rs.getString("user_id"), rs.getString("real_name"),
                rs.getBoolean("doctor_verified"), rs.getBoolean("specialist_verified"), rs.getString("specialty"),
                rs.getBoolean("workplace_verified"), rs.getString("profile_image_url"), rs.getString("bio"),
                rs.getString("status"), instant(rs, "created_at"), instant(rs, "updated_at")
        );
    }

    private void validateTopics(List<String> topics) {
        long distinct = topics.stream().distinct().count();
        if (distinct != topics.size()) throw new IllegalArgumentException("활동 주제를 중복 없이 선택해 주세요.");
        String placeholders = String.join(",", topics.stream().map(ignored -> "?").toList());
        Integer found = jdbc.queryForObject("SELECT COUNT(*) FROM expert_topics WHERE code IN (" + placeholders + ")",
                Integer.class, topics.toArray());
        if (found == null || found != topics.size()) throw new IllegalArgumentException("지원하지 않는 활동 주제가 포함되어 있어요.");
    }

    private void requireUser(String userId) {
        if (count("SELECT COUNT(*) FROM users WHERE id = ?", userId) == 0) {
            throw new ResourceNotFoundException("회원을 찾을 수 없어요.");
        }
    }

    private void requireAnswer(String answerId) {
        if (count("SELECT COUNT(*) FROM expert_answers WHERE id = ? AND status = 'PUBLISHED'", answerId) == 0) {
            throw new ResourceNotFoundException("답변을 찾을 수 없어요.");
        }
    }

    private int count(String sql, Object... args) {
        Integer value = jdbc.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }

    private boolean reactionExists(String table, String userId, String answerId) {
        if (!List.of("expert_answer_helpfuls", "expert_answer_saves").contains(table)) {
            throw new IllegalArgumentException("지원하지 않는 반응 유형이에요.");
        }
        return count("SELECT COUNT(*) FROM " + table + " WHERE user_id = ? AND answer_id = ?", userId, answerId) > 0;
    }

    private String verificationLabel(ExpertRow expert) {
        if (expert.specialistVerified() && expert.workplaceVerified()) return "전문의 · 근무지 인증";
        if (expert.specialistVerified()) return "전문의 인증";
        if (expert.workplaceVerified()) return "의사 · 근무지 인증";
        return "의사 인증";
    }

    private String normalizePeriod(String period) {
        String value = blankToNull(period);
        if (value == null) return "MONTH";
        value = value.toUpperCase(Locale.ROOT);
        if (!List.of("WEEK", "MONTH", "YEAR", "ALL_TIME").contains(value)) {
            throw new IllegalArgumentException("기간은 WEEK, MONTH, YEAR, ALL_TIME 중 하나여야 해요.");
        }
        return value;
    }

    private String normalizeTopic(String topic) {
        String value = blankToNull(topic);
        if (value == null) return null;
        value = value.toUpperCase(Locale.ROOT);
        if (!List.of("BARRIER", "ACNE", "SENSITIVE", "AGING", "INGREDIENT").contains(value)) {
            throw new IllegalArgumentException("지원하지 않는 활동 주제예요.");
        }
        return value;
    }

    private String normalizeQuestionStatus(String status) {
        String value = blankToNull(status);
        if (value == null || "ALL".equalsIgnoreCase(value)) return null;
        value = value.toUpperCase(Locale.ROOT);
        if (!List.of("OPEN", "ANSWERED", "CLOSED").contains(value)) {
            throw new IllegalArgumentException("지원하지 않는 질문 상태예요.");
        }
        return value;
    }

    private Instant rankingSince(String period) {
        return switch (period) {
            case "WEEK" -> Instant.now().minus(7, ChronoUnit.DAYS);
            case "MONTH" -> Instant.now().minus(30, ChronoUnit.DAYS);
            case "YEAR" -> Instant.now().minus(365, ChronoUnit.DAYS);
            default -> null;
        };
    }

    private String hashLicense(String licenseNumber) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String normalized = licenseNumber.replaceAll("[^0-9A-Za-z]", "").toUpperCase(Locale.ROOT);
            return HexFormat.of().formatHex(digest.digest(normalized.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("면허번호 보호 처리를 초기화하지 못했어요.", exception);
        }
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp timestamp = rs.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant();
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private record ExpertRow(
            String id, String slug, String userId, String realName, boolean doctorVerified,
            boolean specialistVerified, String specialty, boolean workplaceVerified,
            String profileImageUrl, String bio, String status, Instant createdAt, Instant updatedAt
    ) {}

    private record RankingDraft(ExpertSummaryResponse expert, int score, ExpertStatsResponse stats) {}
}

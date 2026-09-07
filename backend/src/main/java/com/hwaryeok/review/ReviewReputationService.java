package com.hwaryeok.review;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.hwaryeok.common.error.ForbiddenOperationException;
import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.user.ActiveUserService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReviewReputationService {

    private static final Set<String> SKIN_TYPES = Set.of("건성", "지성", "복합성", "수부지", "중성", "민감");
    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate namedJdbc;
    private final ActiveUserService activeUserService;

    public ReviewReputationService(JdbcTemplate jdbc, ActiveUserService activeUserService) {
        this.jdbc = jdbc;
        this.namedJdbc = new NamedParameterJdbcTemplate(jdbc);
        this.activeUserService = activeUserService;
    }

    @Transactional
    public ReviewCommunityRatingResponse rate(String reviewId, String voterId, Integer score) {
        if (score == null || score < 1 || score > 5) {
            throw new IllegalArgumentException("리뷰 화력은 1점부터 5점까지 선택해 주세요.");
        }
        // Every write from a voter takes the same row lock, including the first rating.
        // Together with the composite primary key this makes repeated/concurrent PUTs idempotent.
        activeUserService.requireActiveForUpdate(voterId);
        String authorId = publicAuthor(reviewId);
        rejectSelfRating(authorId, voterId);
        int updated = jdbc.update("""
                UPDATE review_firepower_ratings SET score = ?, updated_at = CURRENT_TIMESTAMP
                WHERE review_id = ? AND voter_id = ?
                """, score, reviewId, voterId);
        if (updated == 0) {
            jdbc.update("INSERT INTO review_firepower_ratings (review_id, voter_id, score) VALUES (?, ?, ?)",
                    reviewId, voterId, score);
        }
        return summaries(Map.of(reviewId, authorId), voterId).get(reviewId);
    }

    @Transactional
    public ReviewCommunityRatingResponse remove(String reviewId, String voterId) {
        activeUserService.requireActiveForUpdate(voterId);
        String authorId = publicAuthor(reviewId);
        rejectSelfRating(authorId, voterId);
        jdbc.update("DELETE FROM review_firepower_ratings WHERE review_id = ? AND voter_id = ?", reviewId, voterId);
        return summaries(Map.of(reviewId, authorId), voterId).get(reviewId);
    }

    public ReviewCommunityRatingResponse summary(String reviewId, String viewerId) {
        return summaries(Map.of(reviewId, publicAuthor(reviewId)), viewerId).get(reviewId);
    }

    Map<String, ReviewCommunityRatingResponse> summaries(List<ProductReview> reviews, String viewerId) {
        Map<String, String> authors = new LinkedHashMap<>();
        reviews.forEach(review -> authors.put(review.getId(), review.getUser().getId()));
        return summaries(authors, viewerId);
    }

    private Map<String, ReviewCommunityRatingResponse> summaries(Map<String, String> authors, String viewerId) {
        if (authors.isEmpty()) return Map.of();
        boolean activeViewer = viewerId != null && Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT COUNT(*) > 0 FROM users WHERE id = ? AND status = 'ACTIVE'", Boolean.class, viewerId));
        Map<String, ReviewCommunityRatingResponse> result = new HashMap<>();
        authors.forEach((id, author) -> result.put(id,
                new ReviewCommunityRatingResponse(null, 0, null, activeViewer && !author.equals(viewerId))));
        MapSqlParameterSource params = new MapSqlParameterSource("reviewIds", authors.keySet())
                .addValue("viewerId", activeViewer ? viewerId : "");
        namedJdbc.query("""
                SELECT f.review_id, AVG(CAST(f.score AS DECIMAL(12, 4))) AS average_score,
                       COUNT(*) AS rating_count,
                       MAX(CASE WHEN f.voter_id = :viewerId THEN f.score ELSE NULL END) AS viewer_score
                FROM review_firepower_ratings f
                JOIN users voter ON voter.id = f.voter_id AND voter.status = 'ACTIVE'
                JOIN reviews r ON r.id = f.review_id AND r.user_id <> f.voter_id
                JOIN users author ON author.id = r.user_id AND author.status = 'ACTIVE'
                JOIN products p ON p.id = r.product_id AND p.publication_status = 'PUBLISHED'
                WHERE f.review_id IN (:reviewIds)
                GROUP BY f.review_id
                """, params, rs -> {
            String id = rs.getString("review_id");
            Number viewerScore = (Number) rs.getObject("viewer_score");
            result.put(id, new ReviewCommunityRatingResponse(
                    rounded(rs.getBigDecimal("average_score")), rs.getLong("rating_count"),
                    viewerScore == null ? null : viewerScore.intValue(),
                    activeViewer && !authors.get(id).equals(viewerId)));
        });
        return result;
    }

    public ReviewerRankingResponse ranking(String skinType, int page, int size) {
        if (page < 0) throw new IllegalArgumentException("페이지 번호를 다시 확인해 주세요.");
        if (size < 1 || size > 50) throw new IllegalArgumentException("페이지 크기는 1개 이상 50개 이하여야 해요.");
        String skin = normalizeSkinType(skinType);
        List<ReviewerProfileResponse> ranked = rankedProfiles(skin);
        int start = (int) Math.min((long) page * size, ranked.size());
        int end = Math.min(start + size, ranked.size());
        int totalPages = (ranked.size() + size - 1) / size;
        return new ReviewerRankingResponse(ranked.subList(start, end), page, size, ranked.size(),
                totalPages, (long) page + 1 < totalPages, skin);
    }

    public ReviewerProfileResponse profile(String userId) {
        return rankedProfiles(null).stream().filter(profile -> profile.userId().equals(userId)).findFirst()
                .orElseGet(() -> jdbc.query("""
                        SELECT u.id, u.nickname, s.skin_type FROM users u
                        LEFT JOIN user_skin_profiles s ON s.user_id = u.id
                        WHERE u.id = ? AND u.status = 'ACTIVE'
                        """, (rs, rowNum) -> new ReviewerProfileResponse(rs.getString("id"), rs.getString("nickname"),
                        rs.getString("skin_type"), null, null, 0, 0, 0, null, null), userId)
                        .stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("리뷰 사용자를 찾을 수 없어요.")));
    }

    private List<ReviewerProfileResponse> rankedProfiles(String skinType) {
        // One evaluator has one unit of influence per author, regardless of how many reviews they rate.
        List<ReviewerProfileResponse> profiles = jdbc.query("""
                WITH public_reviews AS (
                    SELECT r.id, r.user_id, r.total_score, u.nickname, s.skin_type
                    FROM reviews r
                    JOIN users u ON u.id = r.user_id AND u.status = 'ACTIVE'
                    JOIN products p ON p.id = r.product_id AND p.publication_status = 'PUBLISHED'
                    LEFT JOIN user_skin_profiles s ON s.user_id = u.id
                ), review_totals AS (
                    SELECT user_id, nickname, skin_type, COUNT(*) AS review_count,
                           AVG(total_score) AS average_review_score
                    FROM public_reviews GROUP BY user_id, nickname, skin_type
                ), evaluator_means AS (
                    SELECT r.user_id, f.voter_id, AVG(CAST(f.score AS DECIMAL(12, 4))) AS evaluator_mean,
                           COUNT(*) AS vote_count
                    FROM public_reviews r
                    JOIN review_firepower_ratings f ON f.review_id = r.id AND f.voter_id <> r.user_id
                    JOIN users voter ON voter.id = f.voter_id AND voter.status = 'ACTIVE'
                    GROUP BY r.user_id, f.voter_id
                ), reputation AS (
                    SELECT user_id, AVG(evaluator_mean) AS received_mean,
                           SUM(vote_count) AS received_count, COUNT(*) AS evaluator_count
                    FROM evaluator_means GROUP BY user_id
                )
                SELECT t.*, q.received_mean, q.received_count, q.evaluator_count
                FROM review_totals t LEFT JOIN reputation q ON q.user_id = t.user_id
                """, (rs, rowNum) -> {
            BigDecimal receivedMean = rs.getBigDecimal("received_mean");
            long evaluatorCount = rs.getLong("evaluator_count");
            BigDecimal firepower = receivedMean == null ? null : BigDecimal.valueOf(
                    50 + (receivedMean.doubleValue() * 20 - 50) * evaluatorCount / (evaluatorCount + 5.0))
                    .setScale(1, RoundingMode.HALF_UP);
            return new ReviewerProfileResponse(rs.getString("user_id"), rs.getString("nickname"),
                    rs.getString("skin_type"), firepower, rounded(receivedMean), rs.getLong("received_count"),
                    evaluatorCount, rs.getLong("review_count"), rounded(rs.getBigDecimal("average_review_score")), null);
        });
        Comparator<ReviewerProfileResponse> order = Comparator.comparing(ReviewerProfileResponse::reviewFirepower,
                        Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(Comparator.comparingLong(ReviewerProfileResponse::uniqueRaterCount).reversed())
                .thenComparing(Comparator.comparingLong(ReviewerProfileResponse::receivedRatingCount).reversed())
                .thenComparing(ReviewerProfileResponse::nickname).thenComparing(ReviewerProfileResponse::userId);
        List<ReviewerProfileResponse> sorted = profiles.stream()
                .filter(profile -> skinType == null || skinType.equals(profile.skinType())).sorted(order).toList();
        List<ReviewerProfileResponse> ranked = new ArrayList<>(sorted.size());
        for (int index = 0; index < sorted.size(); index++) {
            ReviewerProfileResponse profile = sorted.get(index);
            ranked.add(profile.withRank(profile.reviewFirepower() == null ? null : index + 1));
        }
        return ranked;
    }

    private String publicAuthor(String reviewId) {
        return jdbc.query("""
                SELECT r.user_id FROM reviews r
                JOIN users u ON u.id = r.user_id AND u.status = 'ACTIVE'
                JOIN products p ON p.id = r.product_id AND p.publication_status = 'PUBLISHED'
                WHERE r.id = ?
                """, (rs, rowNum) -> rs.getString("user_id"), reviewId).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("공개된 리뷰를 찾을 수 없어요."));
    }

    private void rejectSelfRating(String authorId, String voterId) {
        if (authorId.equals(voterId)) throw new ForbiddenOperationException("자신이 작성한 리뷰에는 화력을 매길 수 없어요.");
    }

    private String normalizeSkinType(String skinType) {
        if (skinType == null || skinType.isBlank()) return null;
        String skin = skinType.trim().equals("민감성") ? "민감" : skinType.trim();
        if (!SKIN_TYPES.contains(skin)) throw new IllegalArgumentException("피부 타입을 다시 확인해 주세요.");
        return skin;
    }

    private static BigDecimal rounded(BigDecimal value) {
        return value == null ? null : value.setScale(1, RoundingMode.HALF_UP);
    }
}

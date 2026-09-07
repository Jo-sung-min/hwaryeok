package com.hwaryeok.usagevideo;

import static com.hwaryeok.usagevideo.UsageVideoDtos.*;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import com.hwaryeok.auth.InvalidCredentialsException;
import com.hwaryeok.common.error.ForbiddenOperationException;
import com.hwaryeok.common.error.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UsageVideoService {

    private static final String FROM = """
            FROM product_usage_videos v
            JOIN products p ON p.id = v.product_id
            JOIN users u ON u.id = v.author_id
            """;
    private static final String SELECT = """
            SELECT v.*, p.name AS product_name, p.brand AS product_brand, u.nickname AS author_nickname
            """ + FROM;

    private final JdbcTemplate jdbc;

    public UsageVideoService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public VideoPageResponse publicVideos(String productId, int page, int size) {
        requirePublishedProduct(productId);
        return page("WHERE v.product_id = ? AND p.publication_status = 'PUBLISHED' AND u.status = 'ACTIVE' AND v.status = 'APPROVED'",
                List.of(productId), "v.featured DESC, v.display_order ASC, v.reviewed_at DESC, v.id ASC", page, size, true);
    }

    public VideoPageResponse myVideos(String userId, int page, int size) {
        requireUser(userId, false, false);
        return page("WHERE v.author_id = ?", List.of(userId), "v.created_at DESC, v.id ASC", page, size, false);
    }

    public VideoPageResponse adminVideos(String adminId, String status, int page, int size) {
        requireUser(adminId, true, false);
        String normalizedStatus = normalizeStatus(status, true);
        return page(normalizedStatus == null ? "" : "WHERE v.status = ?",
                normalizedStatus == null ? List.of() : List.of(normalizedStatus),
                "CASE WHEN v.status = 'PENDING' THEN 0 ELSE 1 END, v.created_at DESC, v.id ASC", page, size, false);
    }

    @Transactional
    public VideoResponse submit(String userId, String productId, SubmissionRequest request) {
        // Serializes this user's changes so equivalent YouTube URLs cannot race the unique constraint.
        requireUser(userId, false, true);
        requirePublishedProduct(productId);
        Submission submission = normalize(request);
        rejectDuplicate(userId, productId, submission.video().id(), null);
        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        jdbc.update("""
                INSERT INTO product_usage_videos
                    (id, product_id, author_id, title, description, video_url, video_id, channel_name, channel_url, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, id, productId, userId, submission.title(), submission.description(), submission.video().url(),
                submission.video().id(), submission.channelName(), submission.channelUrl(), Timestamp.from(now), Timestamp.from(now));
        return find(id, false);
    }

    @Transactional
    public VideoResponse edit(String userId, String id, SubmissionRequest request) {
        requireUser(userId, false, true);
        OwnedVideo current = requireOwned(userId, id);
        requirePublishedProduct(current.productId());
        Submission submission = normalize(request);
        rejectDuplicate(userId, current.productId(), submission.video().id(), id);
        // Every user edit requires a fresh moderation decision, including title/channel-only edits.
        jdbc.update("""
                UPDATE product_usage_videos
                SET title = ?, description = ?, video_url = ?, video_id = ?, channel_name = ?, channel_url = ?,
                    status = 'PENDING', featured = FALSE, display_order = 0,
                    moderation_note = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = ?
                WHERE id = ?
                """, submission.title(), submission.description(), submission.video().url(), submission.video().id(),
                submission.channelName(), submission.channelUrl(), Timestamp.from(Instant.now()), id);
        return find(id, false);
    }

    @Transactional
    public void delete(String userId, String id) {
        requireUser(userId, false, true);
        requireOwned(userId, id);
        jdbc.update("DELETE FROM product_usage_videos WHERE id = ?", id);
    }

    @Transactional
    public VideoResponse moderate(String adminId, String id, ModerationRequest request) {
        requireUser(adminId, true, true);
        if (request == null) throw new IllegalArgumentException("노출 관리 정보를 입력해 주세요.");
        String status = normalizeStatus(request.status(), false);
        if (status == null || "PENDING".equals(status)) {
            throw new IllegalArgumentException("승인, 반려, 숨김 중 하나를 선택해 주세요.");
        }
        if (request.featured() == null || request.displayOrder() == null
                || request.displayOrder() < 0 || request.displayOrder() > 100000) {
            throw new IllegalArgumentException("추천 노출 여부와 0~100000 사이의 노출 순서를 입력해 주세요.");
        }
        String note = optionalText(request.moderationNote(), 1000, "검토 메모");
        List<OwnedVideo> rows = jdbc.query("SELECT product_id, author_id FROM product_usage_videos WHERE id = ? FOR UPDATE",
                (rs, rowNum) -> new OwnedVideo(rs.getString("product_id"), rs.getString("author_id")), id);
        if (rows.isEmpty()) throw notFound();
        if ("APPROVED".equals(status)) {
            requirePublishedProduct(rows.getFirst().productId());
            Long activeAuthor = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id = ? AND status = 'ACTIVE'",
                    Long.class, rows.getFirst().authorId());
            if (activeAuthor == null || activeAuthor == 0) {
                throw new IllegalArgumentException("활동 중인 회원이 등록한 영상만 승인할 수 있어요.");
            }
        }
        Instant now = Instant.now();
        jdbc.update("""
                UPDATE product_usage_videos SET status = ?, featured = ?, display_order = ?, moderation_note = ?,
                    reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?
                """, status, "APPROVED".equals(status) && request.featured(), request.displayOrder(), note,
                adminId, Timestamp.from(now), Timestamp.from(now), id);
        return find(id, false);
    }

    private VideoPageResponse page(String where, List<Object> filters, String orderBy, int page, int size, boolean publicView) {
        if (page < 0 || size < 1 || size > 50) {
            throw new IllegalArgumentException("페이지는 0 이상, 목록 크기는 1~50 사이여야 해요.");
        }
        Long count = jdbc.queryForObject("SELECT COUNT(*) " + FROM + where, Long.class, filters.toArray());
        long total = count == null ? 0 : count;
        long totalPages = (total + size - 1) / size;
        long offset = (long) page * size;
        if (offset >= total) return new VideoPageResponse(List.of(), page, size, total, totalPages, false);
        List<Object> args = new ArrayList<>(filters);
        args.add(size);
        args.add(offset);
        List<VideoResponse> content = jdbc.query(SELECT + where + " ORDER BY " + orderBy + " LIMIT ? OFFSET ?",
                (rs, rowNum) -> read(rs, publicView), args.toArray());
        return new VideoPageResponse(content, page, size, total, totalPages, offset + content.size() < total);
    }

    private VideoResponse find(String id, boolean publicView) {
        return jdbc.query(SELECT + " WHERE v.id = ?", (rs, rowNum) -> read(rs, publicView), id)
                .stream().findFirst().orElseThrow(UsageVideoService::notFound);
    }

    private OwnedVideo requireOwned(String userId, String id) {
        List<OwnedVideo> rows = jdbc.query("SELECT product_id, author_id FROM product_usage_videos WHERE id = ? FOR UPDATE",
                (rs, rowNum) -> new OwnedVideo(rs.getString("product_id"), rs.getString("author_id")), id);
        if (rows.isEmpty()) throw notFound();
        if (!rows.getFirst().authorId().equals(userId)) {
            throw new ForbiddenOperationException("본인이 등록한 영상만 수정하거나 삭제할 수 있어요.");
        }
        return rows.getFirst();
    }

    private void requireUser(String userId, boolean admin, boolean forUpdate) {
        if (userId == null || userId.isBlank()) throw new InvalidCredentialsException();
        var rows = jdbc.query("SELECT role, status FROM users WHERE id = ?" + (forUpdate ? " FOR UPDATE" : ""),
                (rs, rowNum) -> List.of(rs.getString("role"), rs.getString("status")), userId);
        if (rows.isEmpty() || !"ACTIVE".equals(rows.getFirst().get(1))) throw new InvalidCredentialsException();
        if (admin && !"ADMIN".equals(rows.getFirst().getFirst())) {
            throw new ForbiddenOperationException("관리자 권한이 필요해요.");
        }
    }

    private void requirePublishedProduct(String productId) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM products WHERE id = ? AND publication_status = 'PUBLISHED'",
                Long.class, productId);
        if (count == null || count == 0) throw new ResourceNotFoundException("공개된 제품을 찾을 수 없어요.");
    }

    private void rejectDuplicate(String userId, String productId, String videoId, String exceptId) {
        Long count = exceptId == null
                ? jdbc.queryForObject("SELECT COUNT(*) FROM product_usage_videos WHERE author_id = ? AND product_id = ? AND video_id = ?",
                    Long.class, userId, productId, videoId)
                : jdbc.queryForObject("SELECT COUNT(*) FROM product_usage_videos WHERE author_id = ? AND product_id = ? AND video_id = ? AND id <> ?",
                    Long.class, userId, productId, videoId, exceptId);
        if (count != null && count > 0) throw new IllegalArgumentException("이 제품에 이미 등록한 영상이에요. 내 영상에서 수정해 주세요.");
    }

    private static Submission normalize(SubmissionRequest request) {
        if (request == null) throw new IllegalArgumentException("영상 정보를 입력해 주세요.");
        return new Submission(requiredText(request.title(), 120, "제목"), optionalText(request.description(), 2000, "설명"),
                YoutubeLinks.video(request.videoUrl()), requiredText(request.channelName(), 100, "채널명"),
                YoutubeLinks.channel(request.channelUrl()));
    }

    private static String requiredText(String value, int max, String label) {
        String normalized = optionalText(value, max, label);
        if (normalized == null) throw new IllegalArgumentException(label + "을(를) 입력해 주세요.");
        return normalized;
    }

    private static String optionalText(String value, int max, String label) {
        if (value == null || value.isBlank()) return null;
        if (value.length() > max || value.indexOf('\u0000') >= 0) {
            throw new IllegalArgumentException(label + "은(는) " + max + "자 이내로 입력해 주세요.");
        }
        return value.trim();
    }

    private static String normalizeStatus(String status, boolean allowAll) {
        if (status == null || status.isBlank()) return null;
        String value = status.trim().toUpperCase(Locale.ROOT);
        if (allowAll && "ALL".equals(value)) return null;
        if (!List.of("PENDING", "APPROVED", "REJECTED", "HIDDEN").contains(value)) {
            throw new IllegalArgumentException("지원하지 않는 영상 상태예요.");
        }
        return value;
    }

    private static VideoResponse read(ResultSet rs, boolean publicView) throws SQLException {
        return new VideoResponse(rs.getString("id"), rs.getString("product_id"), rs.getString("product_name"),
                rs.getString("product_brand"), rs.getString("author_id"), rs.getString("author_nickname"),
                rs.getString("title"), rs.getString("description"), rs.getString("video_url"), rs.getString("video_id"),
                rs.getString("channel_name"), rs.getString("channel_url"), rs.getString("status"), rs.getBoolean("featured"),
                rs.getInt("display_order"), publicView ? null : rs.getString("moderation_note"),
                instant(rs, "created_at"), instant(rs, "updated_at"), instant(rs, "reviewed_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp timestamp = rs.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant();
    }

    private static ResourceNotFoundException notFound() {
        return new ResourceNotFoundException("등록된 영상을 찾을 수 없어요.");
    }

    private record OwnedVideo(String productId, String authorId) {}
    private record Submission(String title, String description, YoutubeLinks.VideoLink video, String channelName, String channelUrl) {}
}

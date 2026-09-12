package com.hwaryeok.usagevideo;

import static com.hwaryeok.usagevideo.UsageVideoDtos.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import com.hwaryeok.auth.InvalidCredentialsException;
import com.hwaryeok.common.error.ForbiddenOperationException;
import com.hwaryeok.common.error.ResourceNotFoundException;
import com.hwaryeok.user.ActivityNickname;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class UsageVideoServiceTest {

    private static final String PRODUCT = "usage-video-product";
    private static final String HIDDEN = "usage-video-hidden-product";

    @Autowired private UsageVideoService service;
    @Autowired private JdbcTemplate jdbc;
    private String author;
    private String other;
    private String admin;

    @BeforeEach
    void setUp() {
        author = user("USER", "ACTIVE");
        other = user("USER", "ACTIVE");
        admin = user("ADMIN", "ACTIVE");
        product(PRODUCT, "PUBLISHED");
        product(HIDDEN, "HIDDEN");
    }

    @Test
    void submissionsRequireApprovalAndEveryEditRemovesPriorExposure() {
        var submitted = service.submit(author, PRODUCT, request("AbC_12345-6"));
        assertThat(submitted.status()).isEqualTo("PENDING");
        assertThat(submitted.reviewedAt()).isNull();
        assertThat(submitted.featured()).isFalse();
        assertThat(service.publicVideos(PRODUCT, 0, 20).content()).isEmpty();

        var approved = service.moderate(admin, submitted.id(), moderation("APPROVED", true, 3));
        assertThat(approved.featured()).isTrue();
        assertThat(approved.reviewedAt()).isNotNull();
        assertThat(service.publicVideos(PRODUCT, 0, 20).content()).singleElement().satisfies(video -> {
            assertThat(video.id()).isEqualTo(submitted.id());
            assertThat(video.moderationNote()).isNull();
            assertThat(video.authorNickname()).startsWith("영상");
        });
        assertThat(service.myVideos(author, 0, 20).content().getFirst().moderationNote()).isEqualTo("검토 메모");
        var edited = service.edit(author, submitted.id(), new SubmissionRequest("바뀐 제목", submitted.videoUrl(), "채널", "https://youtube.com/@beauty", "설명"));
        assertThat(edited.status()).isEqualTo("PENDING");
        assertThat(edited.featured()).isFalse();
        assertThat(edited.displayOrder()).isZero();
        assertThat(edited.reviewedAt()).isNull();
        assertThat(edited.moderationNote()).isNull();
        assertThat(service.publicVideos(PRODUCT, 0, 20).content()).isEmpty();
        assertThat(jdbc.queryForObject("SELECT reviewed_by FROM product_usage_videos WHERE id = ?", String.class, edited.id())).isNull();
    }

    @Test
    void hiddenAndRejectedVideosAreNeverPublicAndCanBeResubmitted() {
        var video = service.submit(author, PRODUCT, request("AbC_12345-6"));
        service.moderate(admin, video.id(), moderation("REJECTED", true, 2));
        assertThat(service.myVideos(author, 0, 20).content().getFirst().status()).isEqualTo("REJECTED");
        assertThat(service.publicVideos(PRODUCT, 0, 20).content()).isEmpty();
        service.edit(author, video.id(), request("AbC_12345-6"));
        service.moderate(admin, video.id(), moderation("APPROVED", true, 2));
        var hidden = service.moderate(admin, video.id(), moderation("HIDDEN", true, 1));
        assertThat(hidden.featured()).isFalse();
        assertThat(service.publicVideos(PRODUCT, 0, 20).content()).isEmpty();
    }

    @Test
    void suspendedAuthorsAndUnpublishedProductsCannotLeakApprovedVideos() {
        var video = service.submit(author, PRODUCT, request("AbC_12345-6"));
        service.moderate(admin, video.id(), moderation("APPROVED", true, 0));
        jdbc.update("UPDATE users SET status = 'SUSPENDED' WHERE id = ?", author);
        assertThat(service.publicVideos(PRODUCT, 0, 20).content()).isEmpty();
        assertThatThrownBy(() -> service.myVideos(author, 0, 20)).isInstanceOf(InvalidCredentialsException.class);
        assertThatThrownBy(() -> service.moderate(admin, video.id(), moderation("APPROVED", false, 0)))
                .isInstanceOf(IllegalArgumentException.class);
        jdbc.update("UPDATE users SET status = 'ACTIVE' WHERE id = ?", author);
        jdbc.update("UPDATE products SET publication_status = 'HIDDEN' WHERE id = ?", PRODUCT);
        assertThatThrownBy(() -> service.publicVideos(PRODUCT, 0, 20)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.edit(author, video.id(), request("AbC_12345-6")))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThat(service.myVideos(author, 0, 20).content()).hasSize(1);
        service.delete(author, video.id());
        assertThat(service.myVideos(author, 0, 20).content()).isEmpty();
    }

    @Test
    void preventsEquivalentDuplicateLinksButAllowsDifferentUsersAndProducts() {
        var first = service.submit(author, PRODUCT, request("AbC_12345-6"));
        assertThatThrownBy(() -> service.submit(author, PRODUCT,
                new SubmissionRequest("중복", "https://youtube.com/shorts/AbC_12345-6", "채널", "https://youtube.com/@beauty", null)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("이미 등록");
        var second = service.submit(author, PRODUCT, request("ZyX_12345-6"));
        assertThatThrownBy(() -> service.edit(author, second.id(), request("AbC_12345-6")))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(service.edit(author, first.id(), request("AbC_12345-6")).videoId()).isEqualTo("AbC_12345-6");
        service.submit(other, PRODUCT, request("AbC_12345-6"));
        jdbc.update("UPDATE products SET publication_status = 'PUBLISHED' WHERE id = ?", HIDDEN);
        service.submit(author, HIDDEN, request("AbC_12345-6"));
        assertThat(service.myVideos(author, 0, 20).totalElements()).isEqualTo(3);
        assertThat(service.myVideos(other, 0, 20).totalElements()).isEqualTo(1);
    }

    @Test
    void requiresOwnershipActiveUserAndRealDatabaseAdminRole() {
        var video = service.submit(author, PRODUCT, request("AbC_12345-6"));
        assertThatThrownBy(() -> service.edit(other, video.id(), request("AbC_12345-6")))
                .isInstanceOf(ForbiddenOperationException.class);
        assertThatThrownBy(() -> service.delete(other, video.id())).isInstanceOf(ForbiddenOperationException.class);
        assertThatThrownBy(() -> service.moderate(author, video.id(), moderation("APPROVED", false, 0)))
                .isInstanceOf(ForbiddenOperationException.class);
        assertThatThrownBy(() -> service.adminVideos(author, null, 0, 20)).isInstanceOf(ForbiddenOperationException.class);
        assertThatThrownBy(() -> service.submit(null, PRODUCT, request("AbC_12345-6")))
                .isInstanceOf(InvalidCredentialsException.class);
        assertThatThrownBy(() -> service.submit(user("USER", "WITHDRAWN"), PRODUCT, request("AbC_12345-6")))
                .isInstanceOf(InvalidCredentialsException.class);
        assertThatThrownBy(() -> service.submit(author, HIDDEN, request("AbC_12345-6")))
                .isInstanceOf(ResourceNotFoundException.class);
        jdbc.update("UPDATE users SET status = 'SUSPENDED' WHERE id = ?", admin);
        assertThatThrownBy(() -> service.adminVideos(admin, null, 0, 20)).isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void exposesOnlyApprovedRowsInAdministratorDefinedOrderWithPagination() {
        var ordinary = service.submit(author, PRODUCT, request("AbC_12345-6"));
        var featuredLater = service.submit(author, PRODUCT, request("ZyX_12345-6"));
        var featuredFirst = service.submit(author, PRODUCT, request("QwE_12345-6"));
        service.submit(author, PRODUCT, request("RtY_12345-6"));
        service.moderate(admin, ordinary.id(), moderation("APPROVED", false, 0));
        service.moderate(admin, featuredLater.id(), moderation("APPROVED", true, 10));
        service.moderate(admin, featuredFirst.id(), moderation("APPROVED", true, 1));
        var first = service.publicVideos(PRODUCT, 0, 2);
        assertThat(first.content()).extracting(VideoResponse::id).containsExactly(featuredFirst.id(), featuredLater.id());
        assertThat(first.totalElements()).isEqualTo(3);
        assertThat(first.totalPages()).isEqualTo(2);
        assertThat(first.hasNext()).isTrue();
        var last = service.publicVideos(PRODUCT, 1, 2);
        assertThat(last.content()).extracting(VideoResponse::id).containsExactly(ordinary.id());
        assertThat(last.hasNext()).isFalse();
        assertThat(service.publicVideos(PRODUCT, Integer.MAX_VALUE, 50).content()).isEmpty();
        assertThat(service.adminVideos(admin, "PENDING", 0, 20).totalElements()).isEqualTo(1);
        assertThat(service.adminVideos(admin, "APPROVED", 0, 20).totalElements()).isEqualTo(3);
    }

    @Test
    void validatesModerationFieldsSubmissionLimitsAndPagination() {
        var video = service.submit(author, PRODUCT, request("AbC_12345-6"));
        for (String status : new String[] {"PENDING", "UNKNOWN", "", "ALL"}) {
            assertThatThrownBy(() -> service.moderate(admin, video.id(), moderation(status, false, 0)))
                    .isInstanceOf(IllegalArgumentException.class);
        }
        assertThatThrownBy(() -> service.moderate(admin, video.id(), moderation("APPROVED", false, -1)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.moderate(admin, video.id(), new ModerationRequest("APPROVED", null, 0, null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.moderate(admin, video.id(), new ModerationRequest("APPROVED", false, 0, "x".repeat(1001))))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.submit(author, PRODUCT, new SubmissionRequest(" ", "https://youtu.be/QwE_12345-6", "채널", "https://youtube.com/@beauty", null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.submit(author, PRODUCT, new SubmissionRequest("x".repeat(121), "https://youtu.be/QwE_12345-6", "채널", "https://youtube.com/@beauty", null)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.publicVideos(PRODUCT, -1, 20)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.myVideos(author, 0, 51)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.adminVideos(admin, "WRONG", 0, 20)).isInstanceOf(IllegalArgumentException.class);
    }

    private String user(String role, String status) {
        String id = UUID.randomUUID().toString();
        String nickname = "영상" + id.substring(0, 8);
        jdbc.update("INSERT INTO users (id, email, password_hash, nickname, nickname_key, role, status) VALUES (?, ?, 'unused', ?, ?, ?, ?)",
                id, id + "@example.com", nickname, ActivityNickname.key(ActivityNickname.normalize(nickname)), role, status);
        return id;
    }

    private void product(String id, String status) {
        jdbc.update("""
                INSERT INTO products (id, brand, name, category, base_score, benefit, sub_benefit, price, tone, publication_status)
                VALUES (?, '영상 테스트', '영상 테스트 제품', '앰플', 0, '보습', '보습', 10000, 'rose', ?)
                """, id, status);
    }

    private SubmissionRequest request(String videoId) {
        return new SubmissionRequest("사용법", "https://youtu.be/" + videoId, "뷰티 채널", "https://youtube.com/@beauty", "사용자가 공유한 영상");
    }

    private ModerationRequest moderation(String status, boolean featured, int order) {
        return new ModerationRequest(status, featured, order, "검토 메모");
    }
}

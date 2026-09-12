package com.hwaryeok.photo;

import com.hwaryeok.user.ActiveUserService;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users/me/photo-analysis")
public class SkinPhotoController {
    private final ActiveUserService users;
    private final SkinPhotoNormalizer normalizer;
    private final SkinPhotoQuota quota;
    private final OpenAiSkinPhotoClient client;
    public SkinPhotoController(ActiveUserService users, SkinPhotoNormalizer normalizer, SkinPhotoQuota quota, OpenAiSkinPhotoClient client) {
        this.users = users; this.normalizer = normalizer; this.quota = quota; this.client = client;
    }
    @GetMapping
    public ResponseEntity<Status> status(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(new Status(client.available(), quota.limit(), quota.remaining(jwt.getSubject())));
    }
    @PostMapping(consumes = {"image/jpeg", "image/png"})
    public ResponseEntity<OpenAiSkinPhotoClient.Report> analyze(@AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-Photo-Consent", defaultValue = "") String consent, HttpServletRequest request) throws IOException {
        users.requireActive(jwt.getSubject());
        if (!"photo-v1".equals(consent)) throw new PhotoAnalysisException(400, "CONSENT_REQUIRED", "사진 분석을 위한 정보 처리에 동의해 주세요.");
        if (!client.available()) throw new PhotoAnalysisException(503, "NOT_CONFIGURED", "사진 분석 서비스를 준비 중이에요. 피부 체크는 바로 이용할 수 있어요.");
        if (request.getContentLengthLong() > SkinPhotoNormalizer.MAX_BYTES) throw new PhotoAnalysisException(413, "PHOTO_TOO_LARGE", "사진은 5MB 이하로 선택해 주세요.");
        byte[] jpeg = normalizer.normalize(request.getInputStream().readNBytes(SkinPhotoNormalizer.MAX_BYTES + 1));
        quota.reserve(jwt.getSubject());
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(client.analyze(jpeg));
    }
    @ExceptionHandler(PhotoAnalysisException.class)
    public ResponseEntity<Map<String, String>> failure(PhotoAnalysisException ex) {
        return ResponseEntity.status(ex.status).header("Cache-Control", "no-store").body(Map.of("code", ex.code, "message", ex.getMessage()));
    }
    public record Status(boolean enabled, int dailyLimit, int remaining) {}
}

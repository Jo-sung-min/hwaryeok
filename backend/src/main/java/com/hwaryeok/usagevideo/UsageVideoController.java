package com.hwaryeok.usagevideo;

import static com.hwaryeok.usagevideo.UsageVideoDtos.*;

import jakarta.validation.Valid;

import com.hwaryeok.auth.InvalidCredentialsException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UsageVideoController {

    private final UsageVideoService service;

    public UsageVideoController(UsageVideoService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/products/{productId}/usage-videos")
    public VideoPageResponse publicVideos(@PathVariable String productId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.publicVideos(productId, page, size);
    }

    @GetMapping("/api/v1/me/usage-videos")
    public VideoPageResponse myVideos(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.myVideos(subject(jwt), page, size);
    }

    @PostMapping("/api/v1/products/{productId}/usage-videos")
    @ResponseStatus(HttpStatus.CREATED)
    public VideoResponse submit(@AuthenticationPrincipal Jwt jwt, @PathVariable String productId,
            @Valid @RequestBody SubmissionRequest request) {
        return service.submit(subject(jwt), productId, request);
    }

    @PatchMapping("/api/v1/me/usage-videos/{id}")
    public VideoResponse edit(@AuthenticationPrincipal Jwt jwt, @PathVariable String id,
            @Valid @RequestBody SubmissionRequest request) {
        return service.edit(subject(jwt), id, request);
    }

    @DeleteMapping("/api/v1/me/usage-videos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        service.delete(subject(jwt), id);
    }

    @GetMapping("/api/v1/admin/usage-videos")
    public VideoPageResponse adminVideos(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.adminVideos(subject(jwt), status, page, size);
    }

    @PatchMapping("/api/v1/admin/usage-videos/{id}")
    public VideoResponse moderate(@AuthenticationPrincipal Jwt jwt, @PathVariable String id,
            @Valid @RequestBody ModerationRequest request) {
        return service.moderate(subject(jwt), id, request);
    }

    private static String subject(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) throw new InvalidCredentialsException();
        return jwt.getSubject();
    }
}

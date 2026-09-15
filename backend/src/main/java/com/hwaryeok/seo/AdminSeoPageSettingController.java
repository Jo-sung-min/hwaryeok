package com.hwaryeok.seo;

import java.util.List;

import com.hwaryeok.user.ActiveUserService;
import com.hwaryeok.user.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/seo/pages")
public class AdminSeoPageSettingController {

    private final SeoPageSettingService settingService;
    private final ActiveUserService activeUserService;

    public AdminSeoPageSettingController(
            SeoPageSettingService settingService,
            ActiveUserService activeUserService
    ) {
        this.settingService = settingService;
        this.activeUserService = activeUserService;
    }

    @GetMapping
    public List<SeoPageSettingResponse> findAll(@AuthenticationPrincipal Jwt jwt) {
        activeUserService.requireAdmin(jwt.getSubject());
        return settingService.findAll();
    }

    @PutMapping("/{pageKey}")
    public SeoPageSettingResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable SeoPageKey pageKey,
            @Valid @RequestBody SeoPageSettingRequest request
    ) {
        User administrator = activeUserService.requireAdmin(jwt.getSubject());
        return settingService.update(pageKey, administrator.getId(), request);
    }
}

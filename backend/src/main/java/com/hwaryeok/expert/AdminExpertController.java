package com.hwaryeok.expert;

import java.util.List;

import jakarta.validation.Valid;

import com.hwaryeok.user.ActiveUserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/experts")
public class AdminExpertController {

    private final ExpertService expertService;
    private final ActiveUserService activeUserService;

    public AdminExpertController(ExpertService expertService, ActiveUserService activeUserService) {
        this.expertService = expertService;
        this.activeUserService = activeUserService;
    }

    @GetMapping("/applications")
    public List<ExpertApplicationResponse> applications(@AuthenticationPrincipal Jwt jwt) {
        activeUserService.requireAdmin(jwt.getSubject());
        return expertService.findApplications();
    }

    @PutMapping("/{expertId}/verification")
    public ExpertApplicationResponse verify(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String expertId,
            @Valid @RequestBody ExpertVerificationRequest request
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return expertService.verify(expertId, request);
    }
}

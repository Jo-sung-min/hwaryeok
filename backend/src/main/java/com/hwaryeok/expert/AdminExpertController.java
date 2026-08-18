package com.hwaryeok.expert;

import java.util.List;

import jakarta.validation.Valid;

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

    public AdminExpertController(ExpertService expertService) {
        this.expertService = expertService;
    }

    @GetMapping("/applications")
    public List<ExpertApplicationResponse> applications() {
        return expertService.findApplications();
    }

    @PutMapping("/{expertId}/verification")
    public ExpertApplicationResponse verify(
            @PathVariable String expertId,
            @Valid @RequestBody ExpertVerificationRequest request
    ) {
        return expertService.verify(expertId, request);
    }
}

package com.hwaryeok.datasource;

import java.util.List;

import com.hwaryeok.user.ActiveUserService;
import com.hwaryeok.user.User;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/data-sources")
public class AdminDataSourceController {

    private final ActiveUserService activeUserService;
    private final CosmeticDataPipelineService dataPipelineService;
    private final MfdsApiSyncService mfdsApiSyncService;
    private final MfdsProductMatchService mfdsProductMatchService;

    public AdminDataSourceController(
            ActiveUserService activeUserService,
            CosmeticDataPipelineService dataPipelineService,
            MfdsApiSyncService mfdsApiSyncService,
            MfdsProductMatchService mfdsProductMatchService
    ) {
        this.activeUserService = activeUserService;
        this.dataPipelineService = dataPipelineService;
        this.mfdsApiSyncService = mfdsApiSyncService;
        this.mfdsProductMatchService = mfdsProductMatchService;
    }

    @GetMapping
    DataPipelineStatusResponse status(@AuthenticationPrincipal Jwt jwt) {
        activeUserService.requireAdmin(jwt.getSubject());
        return dataPipelineService.status();
    }

    @GetMapping("/product-ingredient-sources")
    List<OfficialIngredientListResponse> findOfficialIngredientSources(@AuthenticationPrincipal Jwt jwt) {
        activeUserService.requireAdmin(jwt.getSubject());
        return dataPipelineService.findOfficialIngredientSources();
    }

    @PostMapping("/mfds/sync")
    MfdsSyncResponse syncMfds(@AuthenticationPrincipal Jwt jwt) {
        activeUserService.requireAdmin(jwt.getSubject());
        return mfdsApiSyncService.sync();
    }

    @GetMapping("/mfds/product-matches")
    List<AdminMfdsProductMatchResponse> findProductMatches(@AuthenticationPrincipal Jwt jwt) {
        activeUserService.requireAdmin(jwt.getSubject());
        return mfdsProductMatchService.findAllReviewDecisions();
    }

    @GetMapping("/products/{productId}/mfds-candidates")
    List<MfdsProductCandidateResponse> findMfdsCandidates(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "5") int limit
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return mfdsProductMatchService.findCandidates(productId, query, limit);
    }

    @PutMapping("/products/{productId}/mfds-match")
    AdminMfdsProductMatchResponse saveMfdsMatch(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId,
            @RequestBody MfdsProductMatchRequest request
    ) {
        User reviewer = activeUserService.requireAdmin(jwt.getSubject());
        return mfdsProductMatchService.saveVerifiedMatch(
                productId,
                request.reportId(),
                reviewer.getId(),
                request.reviewNote()
        );
    }

    @PutMapping("/products/{productId}/mfds-no-match")
    AdminMfdsProductMatchResponse saveMfdsNoMatch(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId,
            @RequestBody MfdsProductNoMatchRequest request
    ) {
        User reviewer = activeUserService.requireAdmin(jwt.getSubject());
        return mfdsProductMatchService.saveNoMatch(
                productId,
                reviewer.getId(),
                request.reviewNote()
        );
    }

    @DeleteMapping("/products/{productId}/mfds-match")
    void removeMfdsMatch(@AuthenticationPrincipal Jwt jwt, @PathVariable String productId) {
        activeUserService.requireAdmin(jwt.getSubject());
        mfdsProductMatchService.removeVerifiedMatch(productId);
    }

    @PostMapping(path = "/kcia/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    DataImportResultResponse importKcia(
            @AuthenticationPrincipal Jwt jwt,
            @RequestPart("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean rightsConfirmed
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return dataPipelineService.importKciaDictionary(file, rightsConfirmed);
    }

    @PutMapping("/products/{productId}/official-ingredients")
    OfficialIngredientListResponse saveOfficialIngredients(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String productId,
            @RequestBody OfficialIngredientListRequest request
    ) {
        activeUserService.requireAdmin(jwt.getSubject());
        return dataPipelineService.saveOfficialIngredientList(productId, request);
    }
}

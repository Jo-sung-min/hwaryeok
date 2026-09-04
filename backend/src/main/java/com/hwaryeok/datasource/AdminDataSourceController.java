package com.hwaryeok.datasource;

import java.util.List;

import com.hwaryeok.user.ActiveUserService;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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

    public AdminDataSourceController(
            ActiveUserService activeUserService,
            CosmeticDataPipelineService dataPipelineService,
            MfdsApiSyncService mfdsApiSyncService
    ) {
        this.activeUserService = activeUserService;
        this.dataPipelineService = dataPipelineService;
        this.mfdsApiSyncService = mfdsApiSyncService;
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

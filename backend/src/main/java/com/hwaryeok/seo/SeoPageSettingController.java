package com.hwaryeok.seo;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/seo/pages")
public class SeoPageSettingController {

    private final SeoPageSettingService settingService;

    public SeoPageSettingController(SeoPageSettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    public List<SeoPageSettingResponse> findAll() {
        return settingService.findAll();
    }

    @GetMapping("/{pageKey}")
    public SeoPageSettingResponse find(@PathVariable SeoPageKey pageKey) {
        return settingService.find(pageKey);
    }
}

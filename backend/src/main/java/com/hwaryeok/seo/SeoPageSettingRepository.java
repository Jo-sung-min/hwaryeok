package com.hwaryeok.seo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

interface SeoPageSettingRepository extends JpaRepository<SeoPageSetting, SeoPageKey> {

    @EntityGraph(attributePaths = "keywords")
    Optional<SeoPageSetting> findByPageKey(SeoPageKey pageKey);

    @EntityGraph(attributePaths = "keywords")
    List<SeoPageSetting> findAllBy();
}

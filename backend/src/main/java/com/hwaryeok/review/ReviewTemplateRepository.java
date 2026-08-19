package com.hwaryeok.review;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

interface ReviewTemplateRepository extends JpaRepository<ReviewTemplate, String> {

    @EntityGraph(attributePaths = "category")
    Optional<ReviewTemplate> findFirstByCategoryIdAndActiveTrueOrderByVersionDesc(String categoryId);
}

package com.hwaryeok.review;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

interface ReviewCriterionRepository extends JpaRepository<ReviewCriterion, String> {
    List<ReviewCriterion> findByTemplateIdAndActiveTrueOrderByDisplayOrderAsc(String templateId);
}

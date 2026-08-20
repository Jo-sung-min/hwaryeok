package com.hwaryeok.comparison;

import java.util.List;

import com.hwaryeok.product.ProductPublicationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserComparisonProductRepository extends JpaRepository<UserComparisonProduct, UserComparisonProductId> {

    @EntityGraph(attributePaths = "product")
    List<UserComparisonProduct> findByIdUserIdAndProductPublicationStatusOrderByDisplayOrderAsc(
            String userId,
            ProductPublicationStatus publicationStatus
    );

    long deleteByIdUserId(String userId);
}

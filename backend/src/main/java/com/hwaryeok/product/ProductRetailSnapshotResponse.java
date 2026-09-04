package com.hwaryeok.product;

import java.time.LocalDate;

public record ProductRetailSnapshotResponse(
        boolean matched,
        String productId,
        String retailer,
        String retailerProductId,
        String retailerProductName,
        String retailerUrl,
        String packageInfo,
        Integer regularPrice,
        Integer salePrice,
        String availability,
        LocalDate checkedAt,
        String notes
) {
    public static ProductRetailSnapshotResponse from(ProductRetailSnapshot snapshot) {
        return new ProductRetailSnapshotResponse(
                true,
                snapshot.getProductId(),
                snapshot.getRetailer(),
                snapshot.getRetailerProductId(),
                snapshot.getRetailerProductName(),
                snapshot.getRetailerUrl(),
                snapshot.getPackageInfo(),
                snapshot.getRegularPrice(),
                snapshot.getSalePrice(),
                snapshot.getAvailability(),
                snapshot.getCheckedAt(),
                snapshot.getNotes()
        );
    }

    public static ProductRetailSnapshotResponse unmatched(String productId) {
        return new ProductRetailSnapshotResponse(
                false, productId, null, null, null, null, null, null, null, null, null, null
        );
    }
}

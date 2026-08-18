"use client";

import { startTransition, useEffect } from "react";
import { recordRecentProductAction } from "@/app/recent-products/actions";

export function RecentProductTracker({ productId, enabled }: { productId: string; enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    startTransition(() => {
      void recordRecentProductAction(productId);
    });
  }, [enabled, productId]);

  return null;
}

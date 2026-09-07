"use client";

import { useEffect } from "react";

export function ScrollToTop() {
  useEffect(() => {
    if (window.location.hash) {
      try {
        document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({ behavior: "instant", block: "start" });
      } catch {
        // A malformed hash must not prevent the product page from rendering.
      }
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
  return null;
}

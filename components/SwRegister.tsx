"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // sem service worker: app segue funcionando, só sem push/offline
      });
    }
  }, []);
  return null;
}

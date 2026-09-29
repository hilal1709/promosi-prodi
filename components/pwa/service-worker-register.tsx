"use client";

import { useEffect } from "react";

/**
 * Mendaftarkan public/sw.js. Dipisah dari layout server component karena
 * navigator.serviceWorker hanya ada di browser.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // Service worker dari build statis sebelumnya dapat tetap mengontrol
      // localhost dan menyajikan chunk lama saat `next dev` berjalan.
      // Lepaskan kontrolnya agar hot reload serta input game selalu memakai
      // kode terbaru.
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister());
      });
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Pendaftaran gagal (mis. browser lama), aplikasi tetap jalan normal tanpa PWA offline.
      });
    });
  }, []);

  return null;
}

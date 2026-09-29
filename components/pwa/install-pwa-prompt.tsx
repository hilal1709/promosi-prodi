"use client";

import { useEffect, useState } from "react";
import { IconDownload, IconIosShare, IconX } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePwaInstall } from "@/components/pwa/use-pwa-install";

const DISMISS_KEY = "sisfor_pwa_dismissed_at";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 3; // 3 hari

function readDismissedRecently() {
  try {
    const lastDismiss = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - lastDismiss < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

/**
 * Notifikasi "Instal aplikasi" (PRD bab Fitur Utama #6). Bisa ditutup; setelah
 * ditutup tidak muncul lagi selama 3 hari. Tombol "Unduh Aplikasi" di layar
 * awal tetap tersedia kapan pun lewat {@link InstallAppButton}.
 */
export default function InstallPwaPrompt() {
  const { available, canPrompt, install } = usePwaInstall();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Beri jeda agar tidak langsung menumpuk dengan layar pembuka.
    const timer = window.setTimeout(() => setHidden(readDismissedRecently()), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Penyimpanan diblokir: cukup sembunyikan untuk sesi ini.
    }
    setHidden(true);
  };

  const handleInstall = async () => {
    await install();
    handleDismiss();
  };

  if (hidden || !available) return null;

  return (
    <div
      role="dialog"
      aria-label="Instal aplikasi"
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-xl sm:p-4"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <IconDownload className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold">Instal Kampus Digital</p>
        {canPrompt ? (
          <p className="text-muted-foreground">Pasang di perangkatmu, buka seperti aplikasi biasa.</p>
        ) : (
          <IosHint />
        )}
      </div>
      {canPrompt && (
        <Button size="sm" onClick={handleInstall}>
          Instal
        </Button>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Tutup notifikasi instal"
        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
      >
        <IconX className="h-4 w-4" />
      </button>
    </div>
  );
}

function IosHint({ className }: { className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-1 text-muted-foreground", className)}>
      Ketuk <IconIosShare className="inline h-3.5 w-3.5" /> lalu pilih &quot;Add to Home Screen&quot;.
    </p>
  );
}

/**
 * Tombol permanen "Unduh Aplikasi". Tidak tampil bila aplikasi sudah terpasang
 * atau browser tidak mendukung instalasi.
 */
export function InstallAppButton({ className, size = "lg" }: { className?: string; size?: "sm" | "lg" }) {
  const { available, canPrompt, install } = usePwaInstall();
  const [showIosHint, setShowIosHint] = useState(false);

  if (!available) return null;

  return (
    <div className="relative">
      <Button
        size={size}
        variant="outline"
        className={className}
        onClick={() => (canPrompt ? void install() : setShowIosHint((v) => !v))}
      >
        <IconDownload className="h-4 w-4" />
        Unduh Aplikasi
      </Button>
      {showIosHint && !canPrompt && (
        <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-border bg-card p-3 text-sm shadow-xl">
          <IosHint />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "sisfor_pwa_dismissed_at";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 3; // 3 hari

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error - properti khusus Safari iOS
    window.navigator.standalone === true
  );
}

/**
 * Tombol/prompt "Tambahkan ke Layar Utama" (PRD bab Fitur Utama #6).
 * Menangkap event `beforeinstallprompt` bawaan browser Chromium; untuk iOS
 * (yang tidak mendukung event ini) ditampilkan panduan manual Share > Add to
 * Home Screen.
 */
export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const lastDismiss = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    const withinCooldown = Date.now() - lastDismiss < DISMISS_COOLDOWN_MS;
    if (withinCooldown) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const timer = window.setTimeout(() => {
      if (isIos()) setShowIosHint(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    handleDismiss();
  };

  if (dismissed || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl sm:inset-x-auto sm:right-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Download className="h-5 w-5" />
      </div>
      <div className="flex-1 text-sm">
        <p className="font-bold">Instal SISFOR UISI</p>
        {deferredPrompt ? (
          <p className="text-muted-foreground">Tambahkan ke layar utama HP-mu, seperti aplikasi biasa.</p>
        ) : (
          <p className="text-muted-foreground flex items-center gap-1 flex-wrap">
            Ketuk <Share className="h-3.5 w-3.5 inline" /> lalu pilih &quot;Add to Home Screen&quot;.
          </p>
        )}
      </div>
      {deferredPrompt && (
        <Button size="sm" onClick={handleInstall}>
          Instal
        </Button>
      )}
      <button
        onClick={handleDismiss}
        aria-label="Tutup"
        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

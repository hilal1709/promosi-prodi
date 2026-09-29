"use client";

import { useCallback, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaInstallState {
  /** Event `beforeinstallprompt` yang ditahan agar bisa dipicu dari tombol sendiri. */
  deferredPrompt: BeforeInstallPromptEvent | null;
  installed: boolean;
}

const SERVER_STATE: PwaInstallState = { deferredPrompt: null, installed: false };
let state: PwaInstallState = SERVER_STATE;
const listeners = new Set<() => void>();

function setState(next: Partial<PwaInstallState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export function isIos() {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ mengaku sebagai Mac
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error - properti khusus Safari iOS
    window.navigator.standalone === true
  );
}

// Listener dipasang saat modul dimuat (bukan di useEffect) supaya event
// `beforeinstallprompt` yang muncul sebelum komponen mount tidak terlewat.
if (typeof window !== "undefined") {
  state = { deferredPrompt: null, installed: isStandalone() };
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setState({ deferredPrompt: e as BeforeInstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => {
    setState({ deferredPrompt: null, installed: true });
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Status instalasi PWA bersama untuk banner notifikasi dan tombol "Unduh
 * Aplikasi". `canPrompt` true bila browser (Chromium) siap menampilkan dialog
 * instal; di iOS dialog itu tidak ada, jadi pengguna diarahkan ke Share > Add
 * to Home Screen.
 */
export function usePwaInstall() {
  const current = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);

  const install = useCallback(async () => {
    const prompt = state.deferredPrompt;
    if (!prompt) return "unavailable" as const;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    // Event hanya bisa dipakai sekali.
    setState({ deferredPrompt: null, installed: outcome === "accepted" || state.installed });
    return outcome;
  }, []);

  const ios = useSyncExternalStore(noopSubscribe, isIos, () => false);

  return {
    canPrompt: current.deferredPrompt !== null,
    installed: current.installed,
    ios,
    /** Ada cara instal yang bisa ditawarkan: dialog bawaan browser atau panduan iOS. */
    available: !current.installed && (current.deferredPrompt !== null || ios),
    install,
  };
}

function noopSubscribe() {
  return () => {};
}

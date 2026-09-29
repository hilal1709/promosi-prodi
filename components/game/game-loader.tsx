"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TIPS = [
  "Dekati kristal di depan gedung untuk memulai misi.",
  "Selesaikan ketiga misi untuk melihat jalur yang paling cocok untukmu.",
  "Game terasa berat? Pilih kualitas Hemat di Pengaturan.",
  "Progresmu tersimpan otomatis di perangkat ini.",
];

/**
 * Layar muat bermerek untuk seluruh web: logo dengan orbit berputar, bilah
 * progres, dan tips bergantian. Tanpa `progress` bilahnya bergerak bolak-balik
 * (tak tentu); dengan `progress` (0–100) bilah terisi sesuai persentase.
 */
export function GameLoader({
  label,
  progress,
  className,
  showTips = true,
}: {
  label: string;
  progress?: number;
  className?: string;
  showTips?: boolean;
}) {
  const [tip, setTip] = useState(0);
  useEffect(() => {
    if (!showTips) return;
    const timer = window.setInterval(() => setTip((current) => (current + 1) % TIPS.length), 3200);
    return () => window.clearInterval(timer);
  }, [showTips]);

  const determinate = progress !== undefined;
  return (
    <div className={cn("game-loading", className)} role="status" aria-live="polite">
      <div className="game-loader-mark" aria-hidden="true">
        <span className="game-loader-orbit" />
        <Image src="/icons/icon-192.png" alt="" width={56} height={56} priority unoptimized />
      </div>
      <strong>{label}</strong>
      <div className="game-loader-bar" aria-hidden="true">
        <i className={determinate ? undefined : "is-indeterminate"} style={determinate ? { width: `${Math.max(4, progress)}%` } : undefined} />
      </div>
      {determinate && <span className="game-loader-percent">{Math.round(progress)}%</span>}
      {showTips && <small key={tip} className="game-loader-tip">{TIPS[tip]}</small>}
    </div>
  );
}

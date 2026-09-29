"use client";

import { useRef, useLayoutEffect, type ReactNode } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  /** selector relatif ke container, default anak langsung */
  targetSelector?: string;
  stagger?: number;
  deps?: unknown[];
}

/**
 * Membungkus grid/list (mis. menu Ruang Kerja Digital) dan menganimasikannya
 * muncul satu per satu (stagger) setiap kali `deps` berubah, dipakai saat
 * pengguna berpindah jalur supaya menu terasa "reload" secara halus.
 */
export default function StaggerChildren({
  children,
  className,
  targetSelector = ":scope > *",
  stagger = 0.08,
  deps = [],
}: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(targetSelector);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 24, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger,
          ease: "back.out(1.6)",
        }
      );
    }, el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

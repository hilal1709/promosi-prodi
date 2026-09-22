"use client";

import { useRef, useLayoutEffect, type ReactNode } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

/**
 * Animasi "reveal" untuk kartu hasil kuis: efek flip + fade-scale, sesuai PRD.
 */
export default function RevealCard({
  children,
  className,
  trigger,
}: {
  children: ReactNode;
  className?: string;
  /** ganti value ini untuk memicu ulang animasi (mis. saat hasil kuis baru) */
  trigger?: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.85, rotateX: -12, transformPerspective: 800 },
        {
          opacity: 1,
          scale: 1,
          rotateX: 0,
          duration: 0.7,
          ease: "back.out(1.7)",
        }
      );
    }, el);
    return () => ctx.revert();
  }, [trigger]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

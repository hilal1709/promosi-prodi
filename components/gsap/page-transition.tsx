"use client";

import { useRef, useLayoutEffect, type ReactNode } from "react";
import gsap from "gsap";

/**
 * Dipakai di app/template.tsx. Next.js me-remount template.tsx setiap kali
 * berpindah rute, jadi ini efektif jadi "transisi antar halaman" berbasis
 * GSAP tanpa perlu library routing tambahan.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return <div ref={ref}>{children}</div>;
}

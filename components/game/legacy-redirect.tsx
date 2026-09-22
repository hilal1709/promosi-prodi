"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyRedirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return (
    <main className="game-loading min-h-screen" role="status">
      <span className="game-loader" />
      <strong>Membuka Kampus Digital…</strong>
    </main>
  );
}

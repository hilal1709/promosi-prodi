"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameLoader } from "@/components/game/game-loader";

export default function LegacyRedirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return <GameLoader label="Membuka Kampus Digital…" className="min-h-svh" showTips={false} />;
}

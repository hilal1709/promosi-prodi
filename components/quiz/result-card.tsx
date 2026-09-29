"use client";

import Link from "next/link";
import { useState } from "react";
import { IconArrowRight, IconCheck, IconShare } from "@/components/ui/icons";
import { TrackIllustration } from "@/components/illustrations/track-illustration";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RevealCard from "@/components/gsap/reveal-card";
import { getTrack } from "@/lib/data/tracks";
import type { JalurId } from "@/lib/types";

export default function ResultCard({ jalur }: { jalur: JalurId }) {
  const track = getTrack(jalur);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: "Hasil Kuis Pilih Jalurmu · SISFOR UISI",
      text: `Hasil kuisku: ${track.nama}! Cari tahu jalur SI yang cocok buatmu juga di SISFOR UISI.`,
      url: typeof window !== "undefined" ? window.location.origin + "/kuis" : "",
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // pengguna membatalkan share sheet, lanjut fallback copy
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <RevealCard trigger={jalur}>
      <Card
        className="overflow-hidden"
        style={{ borderTopWidth: 6, borderTopColor: `var(--color-${track.warna})` }}
      >
        <CardContent className="p-6 text-center sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Hasil Kuis Pilih Jalurmu
          </p>
          <TrackIllustration id={track.id} className="mx-auto mt-5 h-28 w-28" />
          <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">{track.nama}</h2>
          <p className="mt-2 font-semibold text-muted-foreground">{track.tagline}</p>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
            {track.deskripsi}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={`/ruang-kerja/${track.id}`}>
                Masuk ke Ruang Kerja Digital <IconArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" onClick={handleShare}>
              {copied ? <IconCheck className="h-4 w-4" /> : <IconShare className="h-4 w-4" />}
              {copied ? "Tersalin!" : "Bagikan Hasil"}
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Penasaran dengan dua jalur lainnya? Kamu bebas menjelajahi ketiganya di dalam Ruang Kerja Digital.
          </p>
        </CardContent>
      </Card>
    </RevealCard>
  );
}

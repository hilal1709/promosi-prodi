"use client";

import { useMemo, useState } from "react";
import { IconChat, IconChevronRight, IconSearch } from "@/components/ui/icons";
import { TrackIllustration } from "@/components/illustrations/track-illustration";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRICULUM } from "@/lib/data/curriculum";
import { TRACK_LIST } from "@/lib/data/tracks";
import { TESTIMONIALS } from "@/lib/data/testimonials";
import { ACHIEVEMENTS } from "@/lib/data/achievements";
import { FAQ_ITEMS } from "@/lib/data/faq";
import { cn } from "@/lib/utils";
import type { FaqItem, JalurId } from "@/lib/types";

export function InfoCenter({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="game-dialog max-w-4xl">
        <DialogHeader>
          <p className="text-xs font-black tracking-[0.16em] text-brand-red">PUSAT INFORMASI KAMPUS</p>
          <DialogTitle className="text-2xl sm:text-3xl">Kenali Sistem Informasi UISI</DialogTitle>
          <DialogDescription>Pelajari mata kuliah, keahlian, karier, cerita alumni, dan prestasi mahasiswa tanpa meninggalkan kampus virtual.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="kurikulum" className="mt-2">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl p-1.5">
            <TabsTrigger value="kurikulum">Kurikulum</TabsTrigger>
            <TabsTrigger value="karier">Karier</TabsTrigger>
            <TabsTrigger value="alumni">Alumni</TabsTrigger>
            <TabsTrigger value="prestasi">Prestasi</TabsTrigger>
          </TabsList>

          <TabsContent value="kurikulum" className="grid gap-3 md:grid-cols-3">
            {TRACK_LIST.map((track) => (
              <article key={track.id} className="rounded-3xl border border-border bg-white p-4">
                <h3 className="font-black" style={{ color: `var(--color-${track.warna}-foreground)` }}>{track.singkatan}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{track.tagline}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {CURRICULUM[track.id].mataKuliahInti.slice(0, 4).map((course) => (
                    <li key={course} className="flex gap-2"><span className="text-brand-gold">◆</span>{course}</li>
                  ))}
                </ul>
              </article>
            ))}
          </TabsContent>

          <TabsContent value="karier" className="grid gap-3 md:grid-cols-3">
            {TRACK_LIST.map((track) => (
              <article key={track.id} className="rounded-3xl border border-border bg-white p-4">
                <div className="flex items-center gap-3"><TrackIllustration id={track.id} className="h-12 w-12" /><h3 className="font-black">{track.singkatan}</h3></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {track.prospekKarier.map((career) => <span key={career} className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">{career}</span>)}
                </div>
              </article>
            ))}
          </TabsContent>

          <TabsContent value="alumni" className="grid gap-3 sm:grid-cols-2">
            {TESTIMONIALS.map((item) => (
              <blockquote key={item.id} className="rounded-3xl border border-border bg-white p-5">
                <p className="text-sm leading-relaxed text-muted-foreground">“{item.kutipan}”</p>
                <footer className="mt-3"><strong className="block">{item.nama}</strong><span className="text-xs text-muted-foreground">{item.jabatanPerusahaan}</span></footer>
              </blockquote>
            ))}
          </TabsContent>

          <TabsContent value="prestasi" className="grid gap-3 sm:grid-cols-2">
            {ACHIEVEMENTS.map((item) => (
              <article key={item.id} className="rounded-3xl border border-border bg-white p-5">
                <span className="rounded-full bg-brand-gold/20 px-2.5 py-1 text-xs font-black text-foreground">{item.tahun}</span>
                <h3 className="mt-3 font-black">{item.judul}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.deskripsi}</p>
              </article>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

const CATEGORIES: Array<FaqItem["kategori"] | "Semua"> = ["Semua", "PMB", "Kurikulum", "Beasiswa"];

export function CampusAssistant({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Semua");
  const [selected, setSelected] = useState<FaqItem | null>(null);
  const filtered = useMemo(
    () => FAQ_ITEMS.filter((item) =>
      (category === "Semua" || item.kategori === category) &&
      (!query.trim() || item.pertanyaan.toLowerCase().includes(query.toLowerCase()))
    ),
    [category, query]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="game-dialog max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-red text-white"><IconChat className="h-5 w-5" /></span>
            <div>
              <DialogTitle>Asisten Kampus</DialogTitle>
              <DialogDescription>Jawaban cepat tentang PMB, kurikulum, dan beasiswa.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {selected ? (
          <div>
            <button className="text-sm font-bold text-primary" onClick={() => setSelected(null)}>← Kembali ke pertanyaan</button>
            <div className="mt-4 rounded-3xl bg-brand-navy p-5 text-white">
              <p className="font-black">{selected.pertanyaan}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{selected.jawaban}</p>
            </div>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2.5">
              <IconSearch className="h-4 w-4 text-muted-foreground" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari pertanyaan…" className="w-full bg-transparent text-sm outline-none" />
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <button key={item} onClick={() => setCategory(item)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold", category === item ? "bg-brand-navy text-white" : "bg-muted text-muted-foreground")}>{item}</button>
              ))}
            </div>
            <div className="max-h-[20rem] space-y-1 overflow-y-auto">
              {filtered.map((item) => (
                <button key={item.id} onClick={() => setSelected(item)} className="flex w-full items-center justify-between gap-3 rounded-2xl p-3 text-left text-sm font-semibold hover:bg-muted">
                  {item.pertanyaan}<IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function TrackDetails({ trackId }: { trackId: JalurId }) {
  const track = TRACK_LIST.find((item) => item.id === trackId)!;
  return (
    <div>
      <p className="text-sm leading-relaxed text-muted-foreground">{track.deskripsi}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {track.prospekKarier.map((career) => <span key={career} className="rounded-full bg-muted px-3 py-1.5 text-sm font-bold">{career}</span>)}
      </div>
    </div>
  );
}

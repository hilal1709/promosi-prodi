"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { MessageCircle, X, Search, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchFaqItems } from "@/lib/data";
import type { FaqItem } from "@/lib/types";
import { FAQ_ITEMS as FAQ_FALLBACK } from "@/lib/data/faq";

const KATEGORI_LIST: FaqItem["kategori"][] = ["PMB", "Kurikulum", "Beasiswa"];

/**
 * Widget chat mengambang berbasis FAQ terstruktur (bukan AI generatif),
 * sesuai PRD bab Fitur Utama #5 & batasan "di luar ruang lingkup".
 */
export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FaqItem[]>(FAQ_FALLBACK);
  const [activeKategori, setActiveKategori] = useState<FaqItem["kategori"] | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FaqItem | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFaqItems().then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 24, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.7)" }
      );
    }
  }, [open]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchKategori = activeKategori ? item.kategori === activeKategori : true;
      const matchQuery = query.trim()
        ? item.pertanyaan.toLowerCase().includes(query.toLowerCase())
        : true;
      return matchKategori && matchQuery;
    });
  }, [items, activeKategori, query]);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div
          ref={panelRef}
          className="mb-3 flex h-[28rem] w-[22rem] max-w-[88vw] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="text-sm font-bold">Tanya SISFOR</p>
              <p className="text-[11px] opacity-80">FAQ PMB, Kurikulum & Beasiswa</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/10" aria-label="Tutup chatbot">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {selected ? (
            <div className="flex flex-1 flex-col overflow-y-auto p-4">
              <button
                onClick={() => setSelected(null)}
                className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali
              </button>
              <p className="rounded-2xl rounded-tl-sm bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground">
                {selected.pertanyaan}
              </p>
              <p className="mt-3 rounded-2xl rounded-tr-sm bg-primary/10 px-3 py-2 text-sm leading-relaxed text-foreground">
                {selected.jawaban}
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-border p-3">
                <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari pertanyaan..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setActiveKategori(null)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      activeKategori === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    Semua
                  </button>
                  {KATEGORI_LIST.map((k) => (
                    <button
                      key={k}
                      onClick={() => setActiveKategori(k)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        activeKategori === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {filtered.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Belum ada FAQ yang cocok. Coba kata kunci lain, atau hubungi panitia PMB.
                  </p>
                )}
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-muted"
                  >
                    <span>{item.pertanyaan}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setOpen((v) => !v);
          setSelected(null);
        }}
        aria-label="Buka chatbot FAQ"
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}

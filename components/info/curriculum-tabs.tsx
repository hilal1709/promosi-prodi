"use client";

import { GraduationCap, Sparkle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TRACK_LIST } from "@/lib/data/tracks";
import { CURRICULUM } from "@/lib/data/curriculum";

export default function CurriculumTabs() {
  return (
    <Tabs defaultValue={TRACK_LIST[0].id} className="w-full">
      <TabsList className="flex w-full flex-wrap justify-center gap-1 sm:inline-flex sm:w-auto">
        {TRACK_LIST.map((t) => (
          <TabsTrigger key={t.id} value={t.id}>
            {t.singkatan}
          </TabsTrigger>
        ))}
      </TabsList>

      {TRACK_LIST.map((t) => {
        const c = CURRICULUM[t.id];
        return (
          <TabsContent key={t.id} value={t.id}>
            <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold" style={{ color: `var(--color-${t.warna})` }}>
                  <GraduationCap className="h-4 w-4" /> Mata Kuliah Inti
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {c.mataKuliahInti.map((m) => (
                    <li key={m} className="flex gap-2">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: `var(--color-${t.warna})` }}
                      />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold" style={{ color: `var(--color-${t.warna})` }}>
                  <Sparkle className="h-4 w-4" /> Keahlian Utama
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {c.keahlianUtama.map((k) => (
                    <li key={k} className="flex gap-2">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: `var(--color-${t.warna})` }}
                      />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

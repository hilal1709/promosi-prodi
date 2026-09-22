import { Briefcase, ShieldCheck, Boxes, ChartSpline } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TRACK_LIST } from "@/lib/data/tracks";

const TRACK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = { ShieldCheck, Boxes, ChartSpline };

export default function CareerGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {TRACK_LIST.map((t) => {
        const Icon = TRACK_ICONS[t.icon] ?? Boxes;
        return (
          <Card key={t.id} style={{ borderTopWidth: 4, borderTopColor: `var(--color-${t.warna})` }}>
            <CardContent className="p-6">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `var(--color-${t.warna}-soft)`, color: `var(--color-${t.warna}-foreground)` }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold">{t.nama}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {t.prospekKarier.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 shrink-0" style={{ color: `var(--color-${t.warna})` }} />
                    {p}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

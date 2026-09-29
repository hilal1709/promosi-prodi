import { TrackIllustration } from "@/components/illustrations/track-illustration";
import { Card, CardContent } from "@/components/ui/card";
import { TRACK_LIST } from "@/lib/data/tracks";

export default function CareerGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {TRACK_LIST.map((t) => {
        return (
          <Card key={t.id} style={{ borderTopWidth: 4, borderTopColor: `var(--color-${t.warna})` }}>
            <CardContent className="p-6">
              <TrackIllustration id={t.id} />
              <h3 className="mt-4 font-bold">{t.nama}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {t.prospekKarier.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: `var(--color-${t.warna})` }} />
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

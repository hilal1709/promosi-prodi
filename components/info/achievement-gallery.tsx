import { IconTrophy } from "@/components/ui/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Achievement } from "@/lib/types";

export default function AchievementGallery({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {achievements.map((a) => (
        <Card key={a.id}>
          <CardContent className="flex gap-4 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/20 text-brand-gold">
              <IconTrophy className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold leading-tight">{a.judul}</h3>
                <Badge variant="outline">{a.tahun}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.deskripsi}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

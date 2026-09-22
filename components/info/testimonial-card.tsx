import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getTrack } from "@/lib/data/tracks";
import type { Testimonial } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const track = testimonial.jalur ? getTrack(testimonial.jalur) : null;
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-6">
        <Quote className="h-6 w-6 text-muted-foreground/40" />
        <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground">&quot;{testimonial.kutipan}&quot;</p>
        <div className="mt-5 flex items-center gap-3">
          <Avatar>
            <AvatarFallback
              style={
                track
                  ? { backgroundColor: `var(--color-${track.warna}-soft)`, color: `var(--color-${track.warna}-foreground)` }
                  : undefined
              }
            >
              {initials(testimonial.nama)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold">{testimonial.nama}</p>
            <p className="text-xs text-muted-foreground">{testimonial.jabatanPerusahaan}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

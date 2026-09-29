"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { IconCheck } from "@/components/ui/icons";
import type { QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function QuestionCard({
  question,
  selectedOptionId,
  onSelect,
  animKey,
}: {
  question: QuizQuestion;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
  animKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, x: 24 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
      );
    }, el);
    return () => ctx.revert();
  }, [animKey]);

  return (
    <Card>
      <CardContent ref={ref} className="p-6 sm:p-8">
        <h2 className="text-balance text-xl font-bold sm:text-2xl">{question.teksPertanyaan}</h2>
        <div className="mt-6 flex flex-col gap-3">
          {question.opsiJawaban.map((opsi) => {
            const active = selectedOptionId === opsi.id;
            return (
              <button
                key={opsi.id}
                onClick={() => onSelect(opsi.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all sm:text-base",
                  active
                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                  )}
                >
                  {active && <IconCheck className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                {opsi.teks}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

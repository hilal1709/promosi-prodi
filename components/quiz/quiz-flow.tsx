"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import QuestionCard from "./question-card";
import ResultCard from "./result-card";
import { fetchQuizQuestions, saveQuizResult } from "@/lib/data";
import { QUIZ_QUESTIONS as FALLBACK_QUESTIONS } from "@/lib/data/quiz-questions";
import { hitungHasilKuis } from "@/lib/quiz";
import { getSessionId, setStoredJalur } from "@/lib/session";
import type { JalurId, QuizQuestion } from "@/lib/types";

export default function QuizFlow() {
  const [questions, setQuestions] = useState<QuizQuestion[]>(FALLBACK_QUESTIONS);
  const [step, setStep] = useState(0);
  const [jawaban, setJawaban] = useState<Record<string, string>>({});
  const [hasil, setHasil] = useState<JalurId | null>(null);

  useEffect(() => {
    fetchQuizQuestions().then(setQuestions).catch(() => {});
  }, []);

  const current = questions[step];
  const progress = useMemo(
    () => Math.round(((step + (hasil ? 1 : 0)) / questions.length) * 100),
    [step, questions.length, hasil]
  );

  const handleSelect = (optionId: string) => {
    const updated = { ...jawaban, [current.id]: optionId };
    setJawaban(updated);

    setTimeout(() => {
      if (step + 1 < questions.length) {
        setStep((s) => s + 1);
      } else {
        const { peminatan } = hitungHasilKuis(questions, updated);
        setHasil(peminatan);
        setStoredJalur(peminatan);
        saveQuizResult({
          sessionId: getSessionId(),
          jawaban: updated,
          peminatanHasil: peminatan,
          skor: hitungHasilKuis(questions, updated).skor,
        });
      }
    }, 220);
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  if (hasil) {
    return <ResultCard jalur={hasil} />;
  }

  if (!current) return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="rounded-full p-2 text-muted-foreground hover:bg-muted disabled:opacity-30"
          aria-label="Pertanyaan sebelumnya"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <Progress value={progress} />
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {step + 1}/{questions.length}
        </span>
      </div>

      <QuestionCard
        question={current}
        selectedOptionId={jawaban[current.id]}
        onSelect={handleSelect}
        animKey={current.id}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

import type { YearInReviewData } from "@/lib/types";
import YearInReviewSlide from "@/components/YearInReviewSlide";

type Props = {
  data: YearInReviewData;
};

export default function YearInReviewCarousel({ data }: Props) {
  const slides = useMemo(
    () => [
      {
        key: "summary",
        title: "Your Year at a Glance",
        caption:
          "A compact view of your coding momentum and contribution profile.",
      },
      {
        key: "focus",
        title: "Where You Focused",
        caption: data.topRepository
          ? `Most of your impact landed in ${data.topRepository.name}.`
          : "No standout repository this year, but the momentum is still visible.",
      },
      {
        key: "rhythm",
        title: "Your Working Rhythm",
        caption: data.mostActiveDay
          ? `Most active on ${data.mostActiveDay} around ${data.mostActiveHour}:00 UTC.`
          : `No most active day yet; your peak activity hour is ${data.mostActiveHour}:00 UTC.`,
      },
    ],
    [data],
  );

  const [index, setIndex] = useState(0);

  const goPrev = () => {
    setIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goNext = () => {
    setIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const current = slides[index];

  return (
    <section className="space-y-4">
      <YearInReviewSlide
        title={current.title}
        caption={current.caption}
        data={data}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => setIndex(slideIndex)}
              aria-label={`Go to slide ${slideIndex + 1}`}
              className={`h-2.5 w-8 rounded-full transition-colors ${
                slideIndex === index ? "bg-accent" : "bg-card-border"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-md border border-card-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-muted hover:text-foreground"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-md border border-card-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-muted hover:text-foreground"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

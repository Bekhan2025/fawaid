"use client";

import * as React from "react";
import {
  Flame,
  Gift,
  Shield,
  Eye,
  Moon,
  Target,
  Compass,
  Footprints,
  type LucideIcon,
} from "lucide-react";
import type { ExampleCard, MiniMarker, Section, SpectrumRow, StepCard, TermDef } from "@/lib/types";
import { renderInline } from "@/components/reader/inline";

const ICONS: Record<string, LucideIcon> = {
  flame: Flame,
  gift: Gift,
  shield: Shield,
  eye: Eye,
  moon: Moon,
  target: Target,
  compass: Compass,
  footprints: Footprints,
};

function IconByName({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? Target;
  return <Cmp className={className} aria-hidden="true" />;
}

/* ============ Данные шкалы ============ */

const ZONES = [
  { kind: "k0", value: "−5", title: "Крайний недостаток", sub: "упущение" },
  { kind: "k1", value: "−3", title: "Умеренный недостаток", sub: "" },
  { kind: "k2", value: "0", title: "Золотая середина", sub: "васатиййа" },
  { kind: "k3", value: "+3", title: "Умеренный избыток", sub: "" },
  { kind: "k4", value: "+5", title: "Крайний избыток", sub: "чрезмерность" },
] as const;

const DOTS = [
  { kind: "k0", left: "0%", value: "−5" },
  { kind: "k1", left: "25%", value: "−3" },
  { kind: "k2", left: "50%", value: "0" },
  { kind: "k3", left: "75%", value: "+3" },
  { kind: "k4", left: "100%", value: "+5" },
] as const;

/* ============ Доска «Пять качеств на одной шкале» ============ */

export function SpectrumBoard({ rows }: { rows: SpectrumRow[] }) {
  const [hover, setHover] = React.useState<number | null>(null);

  return (
    <div className="rounded-xl border bg-card/70 shadow-sm overflow-hidden">
      {/* Шапка: зоны + линейка */}
      <div className="border-b px-4 md:px-6 pt-5 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {ZONES.map((z, i) => (
            <div
              key={z.value}
              className={`${z.kind} rounded-lg border-t-[3px] px-2 py-2 text-center transition-transform ${
                hover === i ? "-translate-y-0.5 shadow-md" : ""
              }`}
              style={{ background: "var(--t)", borderTopColor: "var(--c)" }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <b
                className="block text-[10px] font-extrabold uppercase tracking-wider leading-tight"
                style={{ color: "var(--c)" }}
              >
                {z.title}
              </b>
              <span className="text-[11px] text-muted-foreground">
                {z.value}
                {z.sub ? ` · ${z.sub}` : ""}
              </span>
            </div>
          ))}
        </div>
        <div className="relative h-6 mt-2 mx-[8%]" aria-hidden="true">
          {DOTS.map((d) => (
            <span
              key={d.value}
              className={`${d.kind} absolute -translate-x-1/2 text-[13px] font-extrabold`}
              style={{ left: d.left, color: "var(--c)" }}
            >
              {d.value}
            </span>
          ))}
        </div>
      </div>

      {/* Строки качеств */}
      <div className="divide-y">
        {rows.map((q) => (
          <div key={q.id} className="px-4 md:px-6 py-5">
            <div className="md:grid md:grid-cols-[220px_1fr] md:gap-6">
              {/* Заголовок качества */}
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <span
                  className="flex-none w-11 h-11 rounded-2xl grid place-items-center"
                  style={{ background: `color-mix(in srgb, ${q.color} 12%, transparent)`, color: q.color }}
                >
                  <IconByName name={q.icon} className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold leading-tight">{q.title}</h3>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-bold">
                    {q.en}
                  </p>
                  <p className="text-xs text-muted-foreground italic">{q.note}</p>
                </div>
              </div>

              {/* Тело: полоса + точки + ячейки */}
              <div>
                <div className="relative h-7 mx-[8%] mb-1" aria-hidden="true">
                  <div className="absolute top-1/2 -translate-y-1/2 w-full h-3 rounded-full scale-bar" />
                  {DOTS.map((d, i) => (
                    <span
                      key={d.value}
                      className={`${d.kind} absolute top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[27px] h-[27px] px-1 rounded-full text-[10.5px] font-extrabold text-white grid place-items-center shadow-md transition-transform ${
                        d.kind === "k2" ? "min-w-[34px] h-[34px] text-[12.5px]" : ""
                      } ${hover === i ? "scale-125" : ""}`}
                      style={{ left: d.left, background: "var(--c)" }}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                    >
                      {d.value}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {q.cells.map((cell, i) => (
                    <div
                      key={cell.chip + i}
                      className={`${cell.kind} rounded-xl border-t-[3px] px-3 py-2.5 flex flex-col gap-1.5 transition-transform ${
                        hover === i ? "-translate-y-1 shadow-lg" : ""
                      }`}
                      style={{ background: "var(--t)", borderTopColor: "var(--c)" }}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <span
                        className="self-start text-[10px] font-extrabold text-white rounded-full px-2 py-px"
                        style={{ background: "var(--c)" }}
                      >
                        {cell.chip}
                      </span>
                      <p className="text-xs leading-snug text-foreground/85">{cell.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Мини-шкала «принцип середины» ============ */

export function MiniSpectrum({
  markers,
  terms,
}: {
  markers: MiniMarker[];
  terms: Record<string, TermDef>;
}) {
  return (
    <div className="rounded-xl border bg-card/70 shadow-sm p-6 md:p-8">
      <div className="relative h-12 mx-[6%]">
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-3 rounded-full scale-bar" />
        {markers.map((m) => (
          <span
            key={m.value}
            className={`${m.kind} absolute top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[34px] h-[34px] rounded-full text-white grid place-items-center font-extrabold text-[13px] shadow-lg ${
              m.kind === "k2" ? "min-w-[44px] h-[44px] text-[15px] ring-4 ring-primary/20" : ""
            }`}
            style={{ left: `${m.pos}%`, background: "var(--c)" }}
          >
            {m.value}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 mt-7">
        {markers.map((m) => (
          <div key={m.value} className={`${m.kind} text-center`}>
            <p
              className="text-[11px] font-extrabold uppercase tracking-wider leading-tight"
              style={{ color: "var(--c)" }}
            >
              {m.title}
            </p>
            {m.sub ? (
              <p className="text-xs text-muted-foreground mt-1">{renderInline(m.sub, terms)}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Карточки «Шкала в XXI веке» ============ */

function ExampleItem({ chip, text, kind }: { chip: string; text: string; kind: string }) {
  return (
    <div className={`${kind} rounded-lg px-3 py-2 flex gap-2.5 items-start`} style={{ background: "var(--t)" }}>
      <span
        className="flex-none text-[10px] font-extrabold text-white rounded-full px-2 py-px mt-px"
        style={{ background: "var(--c)" }}
      >
        {chip}
      </span>
      <p className="text-xs leading-snug self-center">{text}</p>
    </div>
  );
}

export function ExamplesCards({ cards }: { cards: ExampleCard[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {cards.map((c) => (
        <div key={c.id} className="rounded-xl border bg-card/70 shadow-sm p-4 flex flex-col gap-3">
          <div>
            <h3 className="font-extrabold text-[15px] leading-tight">{c.quality}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">триггер: {c.trigger}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <ExampleItem kind="k0" chip="−5" text={c.minus} />
            <ExampleItem kind="k2" chip="0" text={c.zero} />
            <ExampleItem kind="k4" chip="+5" text={c.plus} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============ Карточки шагов самооценки ============ */

export function StepsCards({ steps }: { steps: StepCard[] }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {steps.map((s, i) => (
        <div
          key={s.id}
          className="relative overflow-hidden rounded-xl border bg-card/70 shadow-sm p-5 flex flex-col gap-3"
        >
          <span className="absolute top-2 right-3.5 text-3xl font-extrabold text-foreground/10 select-none">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="w-11 h-11 rounded-2xl grid place-items-center bg-primary/15 text-primary">
            <IconByName name={s.icon} className="w-5 h-5" />
          </span>
          <h3 className="font-extrabold text-[15px]">{s.title}</h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

/* ============ Диспетчер атласа ============ */

export function AtlasRenderer({
  atlas,
  terms,
}: {
  atlas: NonNullable<Section["atlas"]>;
  terms: Record<string, TermDef>;
}) {
  const caption = atlas.caption ? (
    <p className="text-xs text-muted-foreground text-center mt-4 max-w-2xl mx-auto leading-relaxed">
      {renderInline(atlas.caption, terms)}
    </p>
  ) : null;

  switch (atlas.kind) {
    case "mini":
      return (
        <div className="animate-rise">
          <MiniSpectrum markers={atlas.markers} terms={terms} />
          {caption}
        </div>
      );
    case "spectrum":
      return (
        <div className="animate-rise">
          <SpectrumBoard rows={atlas.rows} />
          {caption}
        </div>
      );
    case "examples":
      return (
        <div className="animate-rise">
          <ExamplesCards cards={atlas.cards} />
          {caption}
        </div>
      );
    case "steps":
      return (
        <div className="animate-rise">
          <StepsCards steps={atlas.steps} />
          {caption}
        </div>
      );
  }
}

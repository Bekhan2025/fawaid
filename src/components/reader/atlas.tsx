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
import type {
  ExampleCard,
  MiniMarker,
  Section,
  SpectrumRow,
  StepCard,
  TermDef,
} from "@/lib/types";
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
  { kind: "k0", value: "−5" },
  { kind: "k1", value: "−3" },
  { kind: "k2", value: "0" },
  { kind: "k3", value: "+3" },
  { kind: "k4", value: "+5" },
] as const;

/**
 * Единый шаблон доски: колонка подписи качества + пять зон шкалы.
 * Внутренние сетки зон используют тот же шаблон, поэтому шапка,
 * полоса шкалы и ячейки всегда выровнены по вертикали.
 */
const BOARD_GRID =
  "grid grid-cols-[minmax(8rem,12rem)_repeat(5,minmax(0,1fr))] gap-x-3";
const ZONES_GRID = "grid grid-cols-5 gap-x-3";

/** Сегмент полосы шкалы: соседние ячейки смыкаются, крайние скругляются. */
function barSegmentClass(i: number) {
  const last = DOTS.length - 1;
  if (i === 0) return "left-1/2 right-0 -mr-1.5 rounded-l-full";
  if (i === last) return "left-0 right-1/2 -ml-1.5 rounded-r-full";
  return "inset-x-0 -mx-1.5";
}

/* ============ Доска «Пять качеств на одной шкале» ============ */

export function SpectrumBoard({ rows }: { rows: SpectrumRow[] }) {
  const [hover, setHover] = React.useState<{
    row: number | null;
    zone: number | null;
  }>({
    row: null,
    zone: null,
  });
  const clear = () => setHover({ row: null, zone: null });

  return (
    <div className="rounded-xl border bg-card/70 shadow-sm">
      {/* На узком экране шкала прокручивается, а не сжимается в нечитаемое */}
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Шапка: подпись колонки + пять зон */}
          <div
            className={`${BOARD_GRID} items-end border-b px-4 md:px-6 pt-5 pb-4`}
          >
            <p className="pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Качество
            </p>
            <div className={`${ZONES_GRID} col-span-5`}>
              {ZONES.map((z, i) => (
                <div
                  key={z.value}
                  className={`${z.kind} rounded-lg border-t-[3px] px-2 py-2 text-center transition-all ${
                    hover.zone === i ? "-translate-y-0.5 shadow-md" : ""
                  }`}
                  style={{ background: "var(--t)", borderTopColor: "var(--c)" }}
                  onMouseEnter={() => setHover({ row: null, zone: i })}
                  onMouseLeave={clear}
                >
                  <b
                    className="block text-[10px] font-extrabold uppercase tracking-wide leading-tight text-balance"
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
          </div>

          {/* Строки качеств */}
          <div className="divide-y">
            {rows.map((q, rowIdx) => (
              <div
                key={q.id}
                className={`${BOARD_GRID} items-start px-4 md:px-6 py-5 transition-colors ${
                  hover.row === rowIdx ? "bg-muted/40" : ""
                }`}
                onMouseEnter={() =>
                  setHover((h) => ({ row: rowIdx, zone: h.zone }))
                }
                onMouseLeave={clear}
              >
                {/* Заголовок качества */}
                <div className="flex items-center gap-3">
                  <span
                    className="flex-none w-11 h-11 rounded-2xl grid place-items-center"
                    style={{
                      background: `color-mix(in srgb, ${q.color} 12%, transparent)`,
                      color: q.color,
                    }}
                  >
                    <IconByName name={q.icon} className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold leading-tight">
                      {q.title}
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-bold">
                      {q.en}
                    </p>
                    <p className="text-xs text-muted-foreground italic leading-snug text-pretty">
                      {q.note}
                    </p>
                  </div>
                </div>

                {/* Тело: полоса + точки + ячейки */}
                <div className="col-span-5">
                  <div className={`${ZONES_GRID} mb-1.5`} aria-hidden="true">
                    {DOTS.map((d, i) => {
                      const mid = d.kind === "k2";
                      return (
                        <div
                          key={d.value}
                          className="relative grid h-8 place-items-center"
                        >
                          <span
                            className={`absolute top-1/2 h-3 -translate-y-1/2 scale-bar ${barSegmentClass(i)}`}
                          />
                          <span
                            className={`${d.kind} relative z-10 grid place-items-center rounded-full px-1 font-extrabold text-white shadow-md transition-transform ${
                              mid
                                ? "h-[32px] min-w-[32px] text-[12px]"
                                : "h-[26px] min-w-[26px] text-[10.5px]"
                            } ${hover.zone === i ? "scale-110" : ""}`}
                            style={{ background: "var(--c)" }}
                          >
                            {d.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={ZONES_GRID}>
                    {q.cells.map((cell, i) => (
                      <div
                        key={cell.chip + i}
                        className={`${cell.kind} flex flex-col gap-1.5 rounded-xl border-t-[3px] px-2.5 py-2.5 text-left transition-all ${
                          hover.zone === i ? "ring-2 ring-primary/20" : ""
                        } ${hover.row === rowIdx && hover.zone === i ? "-translate-y-1 shadow-lg" : ""}`}
                        style={{
                          background: "var(--t)",
                          borderTopColor: "var(--c)",
                        }}
                        onMouseEnter={() => setHover({ row: rowIdx, zone: i })}
                        onMouseLeave={() =>
                          setHover((h) => ({ row: h.row, zone: null }))
                        }
                      >
                        <span
                          className="self-start text-[10px] font-extrabold text-white rounded-full px-2 py-px"
                          style={{ background: "var(--c)" }}
                        >
                          {cell.chip}
                        </span>
                        <p className="text-xs leading-snug text-foreground/85 hyphens-auto text-pretty">
                          {cell.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
  const cols = {
    gridTemplateColumns: `repeat(${markers.length}, minmax(0, 1fr))`,
  };
  /** Отступ полосы до центров крайних точек. */
  const inset = `${100 / (markers.length * 2)}%`;

  return (
    <div className="rounded-xl border bg-card/70 shadow-sm p-5 md:p-7">
      <div className="relative">
        <div
          className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full scale-bar"
          style={{ left: inset, right: inset }}
          aria-hidden="true"
        />
        <div className="relative grid items-center gap-3" style={cols}>
          {markers.map((m) => (
            <div key={m.value} className="grid h-12 place-items-center">
              <span
                className={`${m.kind} grid place-items-center rounded-full font-extrabold text-white shadow-lg ${
                  m.kind === "k2"
                    ? "h-11 min-w-11 text-[15px] ring-4 ring-primary/20"
                    : "h-9 min-w-9 text-[13px]"
                }`}
                style={{ background: "var(--c)" }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-3" style={cols}>
        {markers.map((m) => (
          <div key={m.value} className={`${m.kind} text-center`}>
            <p
              className="text-[11px] font-extrabold uppercase tracking-wider leading-tight"
              style={{ color: "var(--c)" }}
            >
              {m.title}
            </p>
            {m.sub ? (
              <p className="text-xs text-muted-foreground mt-1">
                {renderInline(m.sub, terms)}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Карточки «Шкала в XXI веке» ============ */

function ExampleItem({
  chip,
  text,
  kind,
}: {
  chip: string;
  text: string;
  kind: string;
}) {
  return (
    <div
      className={`${kind} rounded-lg px-3 py-2 flex gap-2.5 items-start`}
      style={{ background: "var(--t)" }}
    >
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
        <div
          key={c.id}
          className="rounded-xl border bg-card/70 shadow-sm p-4 flex flex-col gap-3"
        >
          <div>
            <h3 className="font-extrabold text-[15px] leading-tight">
              {c.quality}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              триггер: {c.trigger}
            </p>
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
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {s.text}
          </p>
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
    <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
      {renderInline(atlas.caption, terms)}
    </p>
  ) : null;

  switch (atlas.kind) {
    case "relations":
      return <div><ul className="space-y-4" aria-label="Связи между понятиями">{atlas.pairs.map(pair=><li key={pair.id} className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr] rounded-xl border bg-card/60 p-5">
        <p className="font-bold md:text-right">{pair.left}</p>
        <p className="text-xs text-muted-foreground border-y py-2 md:border-y-0 md:border-x md:px-4 md:max-w-[12rem] text-center">{pair.relation}</p>
        <p className="font-bold">{pair.right}</p>
      </li>)}</ul>{caption}</div>;

    case "correspondence":
      return <div><dl className="divide-y rounded-xl border bg-card/60">{atlas.rows.map(row=><div key={row.id} className="grid gap-3 md:grid-cols-[8rem_1fr] p-5">
        <dt className="text-sm font-bold text-primary">{row.reference}</dt>
        <dd><h3 className="font-bold">{row.concept}</h3><p className="text-sm leading-relaxed text-muted-foreground mt-2">{row.text}</p></dd>
      </div>)}</dl>{caption}</div>;

    case "branching":
      return (
        <div className="space-y-4">
          <div className="mx-auto max-w-xl border-2 rounded-xl bg-card p-5 text-center">
            <h3 className="font-bold text-lg">{atlas.root.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {atlas.root.text}
            </p>
          </div>
          <div
            className="grid gap-6 md:grid-cols-2"
            aria-label="Направления воздействия"
          >
            {atlas.branches.map((branch) => (
              <section key={branch.id} className="border-t-2 pt-4">
                <h3 className="font-bold mb-4">{branch.title}</h3>
                <ol className="space-y-3">
                  {branch.nodes.map((node) => (
                    <li key={node.id} className="relative pl-7">
                      <span
                        className="absolute left-1 top-1 text-muted-foreground"
                        aria-hidden="true"
                      >
                        ↓
                      </span>
                      <div className="border rounded-xl bg-card/60 p-4">
                        <h4 className="font-semibold">{node.title}</h4>
                        <p className="text-sm leading-relaxed text-muted-foreground mt-2">
                          {node.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
          {caption}
        </div>
      );

    case "conditions":
      return (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-primary">
            Все условия действуют совместно
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {atlas.items.map((item) => (
              <li key={item.id} className="rounded-xl border bg-card/70 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {item.role}
                </p>
                <h3 className="font-bold mt-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-l-4 border-primary bg-primary/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide">
              При их сочетании
            </p>
            <p className="font-semibold mt-1">{atlas.result}</p>
          </div>
          {caption}
        </div>
      );
    case "comparison":
      return (
        <div>
          <div className="overflow-hidden rounded-xl border bg-card/60">
            <div
              className="hidden md:grid md:grid-cols-[1fr_2fr_2fr] gap-4 p-4 border-b bg-muted/50"
              aria-hidden="true"
            >
              <span>Основание сравнения</span>
              {atlas.columns.map((c) => (
                <span key={c} className="font-bold">
                  {c}
                </span>
              ))}
            </div>
            <dl className="divide-y">
              {atlas.rows.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-4 md:grid-cols-[1fr_2fr_2fr] p-4 md:p-5"
                >
                  <dt className="font-bold text-primary">{row.aspect}</dt>
                  <dd>
                    <span className="block text-xs font-bold mb-1 md:sr-only">
                      {atlas.columns[0]}
                    </span>
                    <p className="text-sm leading-relaxed">{row.left}</p>
                  </dd>
                  <dd>
                    <span className="block text-xs font-bold mb-1 md:sr-only">
                      {atlas.columns[1]}
                    </span>
                    <p className="text-sm leading-relaxed">{row.right}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          {caption}
        </div>
      );

    case "cases":
      return (
        <div className="space-y-4">
          <p className="text-lg font-semibold border-l-4 border-primary pl-4">
            {atlas.question}
          </p>
          <div className="divide-y rounded-xl border bg-card/60">
            {atlas.cases.map((branch) => (
              <section
                key={branch.id}
                className="p-5 grid gap-4 md:grid-cols-[1fr_2fr]"
              >
                <h3 className="font-bold text-primary">{branch.condition}</h3>
                <ul className="space-y-3">
                  {branch.outcomes.map((outcome, i) => (
                    <li key={i} className="border-l-2 pl-4">
                      {outcome.condition && (
                        <h4 className="font-semibold mb-1">
                          Если {outcome.condition}
                        </h4>
                      )}
                      <p className="text-sm leading-relaxed">{outcome.text}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {caption}
        </div>
      );

    case "cards":
    case "chain":
      return (
        <div className="animate-rise">
          <ol
            className={
              atlas.kind === "chain" && atlas.cards.length > 2
                ? "grid gap-4 md:grid-cols-3"
                : atlas.kind === "chain" || atlas.cards.length === 2
                  ? "grid gap-4 md:grid-cols-2"
                  : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            }
            aria-label={
              atlas.kind === "chain" ? "Причинная связь" : "Карта содержания"
            }
          >
            {atlas.cards.map((card, index) => (
              <li key={card.id} className="rounded-xl border bg-card/70 p-5">
                <span
                  className="text-xs font-semibold text-primary"
                  aria-hidden="true"
                >
                  {atlas.kind === "chain" && index > 0 ? "→ " : ""}
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-bold mt-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                  {card.text}
                </p>
              </li>
            ))}
          </ol>
          {caption}
        </div>
      );

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

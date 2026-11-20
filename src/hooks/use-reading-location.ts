"use client";

import * as React from "react";
import { BOOK_TEXT } from "@/content/book";
import type { LayerId } from "@/lib/types";

const STORAGE_KEY = "fawaid:reading:v1";
const DEFAULT = { entryId: "e310", layer: "book" as LayerId, position: 0 };
type Location = typeof DEFAULT & { target?: string };
function parse(value: unknown): Location | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.entryId !== "string" || !Object.hasOwn(BOOK_TEXT, v.entryId))
    return null;
  return {
    entryId: v.entryId,
    target:
      typeof v.target === "string" &&
      /^e\d+-(?:para-\d+|fn-\d+)$/.test(v.target) &&
      v.target.startsWith(`${v.entryId}-`)
        ? v.target
        : undefined,
    layer: v.layer === "razbor" || v.layer === "atlas" ? v.layer : "book",
    position:
      typeof v.position === "number" && Number.isFinite(v.position)
        ? Math.max(0, Math.min(1, v.position))
        : 0,
  };
}
function fromUrl(): Location | null {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("entry") && !params.has("layer")) return null;
  return (
    parse({
      entryId: params.get("entry") ?? DEFAULT.entryId,
      layer: params.get("layer"),
      target: window.location.hash.slice(1),
    }) ?? DEFAULT
  );
}
function urlFor(location: Location) {
  const url = new URL(window.location.href);
  url.searchParams.set("entry", location.entryId);
  url.searchParams.set("layer", location.layer);
  url.hash = location.target ?? "";
  return url;
}
function position() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
}

function persist(value: Location) {
  window.history.replaceState({ ...window.history.state, fawaid: value }, "");
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
}

export function useReadingLocation() {
  const [location, setLocation] = React.useState<Location>(DEFAULT);
  const [ready, setReady] = React.useState(false);
  const current = React.useRef<Location>(DEFAULT);
  const restoring = React.useRef(false);

  React.useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    let saved: Location | null = null;
    try {
      saved = parse(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
    } catch {}
    // A shared URL selects the entry/layer; restore progress only for the same target.
    const explicit = fromUrl();
    const initial = explicit
      ? {
          ...explicit,
          position:
            saved?.entryId === explicit.entryId &&
            saved.layer === explicit.layer
              ? saved.position
              : 0,
        }
      : (saved ?? DEFAULT);
    current.current = initial;
    window.history.replaceState(
      { ...window.history.state, fawaid: initial },
      "",
      urlFor(initial),
    );
    setLocation(initial);
    setReady(true);
    const onPop = (event: PopStateEvent) => {
      const next = parse(event.state?.fawaid) ?? fromUrl() ?? DEFAULT;
      restoring.current = true;
      current.current = next;
      setLocation({ ...next });
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    restoring.current = true;
    let cancelled = false;
    let interacted = false;
    const onInteraction = () => {
      interacted = true;
    };
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    for (const event of events)
      window.addEventListener(event, onInteraction, { passive: true });
    const restore = () => {
      if (cancelled) return;
      if (interacted) {
        restoring.current = false;
        return;
      }
      const max = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const target = location.target
        ? document.getElementById(location.target)
        : null;
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "instant" });
        target.focus({ preventScroll: true });
      } else
        window.scrollTo({ top: location.position * max, behavior: "instant" });
      restoring.current = false;
      const value = { ...location, target: undefined, position: position() };
      current.current = value;
      persist(value);
    };
    const frame = requestAnimationFrame(restore);
    // Font metrics can change the document height after the first paint.
    void document.fonts.ready.then(restore);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      for (const event of events)
        window.removeEventListener(event, onInteraction);
    };
  }, [location, ready]);

  React.useEffect(() => {
    if (!ready) return;
    const save = () => {
      if (restoring.current) return;
      const value = { ...current.current, position: position() };
      current.current = value;
      persist(value);
    };
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(save, 150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", save);
    save();
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", save);
    };
  }, [ready]);

  const navigate = React.useCallback(
    (entryId: string, layer: LayerId, target?: string) => {
      if (!ready || !Object.hasOwn(BOOK_TEXT, entryId)) return;
      if (
        !target &&
        entryId === current.current.entryId &&
        layer === current.current.layer
      )
        return;
      const previous = { ...current.current, position: position() };
      window.history.replaceState(
        { ...window.history.state, fawaid: previous },
        "",
      );
      const next = { entryId, layer, position: 0, target };
      restoring.current = true;
      current.current = next;
      window.history.pushState(
        { ...window.history.state, fawaid: next },
        "",
        urlFor(next),
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      setLocation(next);
    },
    [ready],
  );

  return { entryId: location.entryId, layer: location.layer, navigate };
}

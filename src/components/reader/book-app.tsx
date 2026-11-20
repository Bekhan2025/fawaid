"use client";

import { useSyncExternalStore } from "react";
import { BOOK } from "@/content/book";
import { BookHome } from "./book-home";
import { ReaderApp } from "./reader-app";

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

function hasReadingLocation() {
  const params = new URLSearchParams(window.location.search);
  return params.has("entry") || params.has("layer");
}

export function BookApp() {
  const reading = useSyncExternalStore(subscribe, hasReadingLocation, () => false);
  return reading ? <ReaderApp book={BOOK} /> : <BookHome />;
}

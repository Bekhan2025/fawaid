import { ReaderApp } from "@/components/reader/reader-app";
import { BOOK } from "@/content/book";

export default function Home() {
  return <ReaderApp book={BOOK} />;
}

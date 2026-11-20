import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
const directory = ".next/static/chunks";
const files = readdirSync(directory, { recursive: true }).filter(
  (name): name is string => typeof name === "string" && name.endsWith(".js"),
);
const chunks = files
  .map((file) => {
    const bytes = readFileSync(`${directory}/${file}`);
    return { file, bytes: bytes.length, gzip: gzipSync(bytes).length };
  })
  .sort((a, b) => b.gzip - a.gzip);
const report = {
  note: "All generated JS chunks, including lazy chunks; not initial page transfer.",
  chunks: chunks.length,
  bytes: chunks.reduce((n, c) => n + c.bytes, 0),
  gzip: chunks.reduce((n, c) => n + c.gzip, 0),
  largest: chunks.slice(0, 8),
};
writeFileSync(
  ".next/bundle-report.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `JS: ${report.chunks} chunks; ${(report.bytes / 1024).toFixed(0)} KiB raw; ${(report.gzip / 1024).toFixed(0)} KiB gzip (all routes and lazy chunks).`,
);
for (const c of report.largest)
  console.log(`${(c.gzip / 1024).toFixed(0)} KiB gzip · ${c.file}`);

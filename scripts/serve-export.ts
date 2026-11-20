/// <reference types="bun-types" />
import { resolve, sep } from "node:path";
import { file, serve } from "bun";

// Preview the exported files under the same prefix used by GitHub Pages.
// Missing files return 404 rather than falling back to the app shell.
const root = resolve("out");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const server = serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT || 3000),
  async fetch(request) {
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      return new Response("Bad request", { status: 400 });
    }
    if (pathname === basePath && basePath) {
      const url = new URL(request.url);
      url.pathname += "/";
      return Response.redirect(url, 308);
    }
    if (!pathname.startsWith(`${basePath}/`)) {
      return new Response("Not found", { status: 404 });
    }
    const relative = pathname.slice(basePath.length);
    const path = resolve(root, `.${relative}${relative.endsWith("/") ? "index.html" : ""}`);
    if (!path.startsWith(root + sep)) {
      return new Response("Not found", { status: 404 });
    }
    const asset = file(path);
    return (await asset.exists())
      ? new Response(asset)
      : new Response("Not found", { status: 404 });
  },
});
console.log(`Ready at http://${server.hostname}:${server.port}${basePath}/`);

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const workspaceRoot = resolve(process.cwd());
const buildRoot = resolve(join(workspaceRoot, "dist"));
const root = existsSync(join(buildRoot, "index.html")) ? buildRoot : workspaceRoot;
const port = Number(process.env.PORT || 4174);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
  const requested = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, "");
  let filePath = resolve(join(root, requested || "index.html"));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = resolve(join(root, "index.html"));
  }

  response.writeHead(200, { "Content-Type": mime[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Smartefluentes running at http://127.0.0.1:${port}`);
});

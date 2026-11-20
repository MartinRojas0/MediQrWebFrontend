"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "dist");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8810);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400);
    response.end("Invalid URL");
    return;
  }

  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const file = path.resolve(root, `.${requestedPath}`);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
    response.writeHead(400);
    response.end("Invalid path");
    return;
  }

  fs.stat(file, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": stats.size,
      "Content-Type": contentTypes[path.extname(file).toLowerCase()] || "application/octet-stream"
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }

    const stream = fs.createReadStream(file);
    stream.on("error", () => {
      if (!response.headersSent) response.writeHead(500);
      response.end();
    });
    stream.pipe(response);
  });
});

server.listen(port, host, () => {
  console.log(`MediQR frontend: http://${host}:${port}`);
});

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const configuredApiUrl = process.env.MEDIQR_API_URL;
if (!configuredApiUrl) {
  throw new Error("Set MEDIQR_API_URL to an HTTPS API URL or a loopback HTTP API URL ending in /api.");
}

const apiUrl = new URL(configuredApiUrl);
const isLoopbackHttp = apiUrl.protocol === "http:" &&
  ["localhost", "127.0.0.1", "[::1]"].includes(apiUrl.hostname);
if ((apiUrl.protocol !== "https:" && !isLoopbackHttp) ||
    !apiUrl.pathname.replace(/\/+$/, "").endsWith("/api") ||
    apiUrl.search || apiUrl.hash || apiUrl.username || apiUrl.password) {
  throw new Error("MEDIQR_API_URL must be HTTPS, or loopback HTTP for local development, ending in /api without credentials, query, or fragment.");
}

const root = path.resolve(__dirname, "..");
const output = path.resolve(root, "dist");
if (!output.startsWith(root + path.sep)) {
  throw new Error("Invalid build output path.");
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(path.join(root, "index.html"), path.join(output, "index.html"));
for (const directory of ["css", "img", "js"]) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
}

const config = `window.MEDIQR_CONFIG = Object.freeze({\n  API_URL: ${JSON.stringify(apiUrl.toString().replace(/\/+$/, ""))}\n});\n`;
fs.writeFileSync(path.join(output, "js", "config.js"), config, "utf8");
console.log(`Built MediQR frontend for ${apiUrl.origin}.`);

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const configuredApiUrl = process.env.MEDIQR_API_URL;
if (!configuredApiUrl) {
  throw new Error("Set MEDIQR_API_URL to the deployed HTTPS API URL ending in /api.");
}

const apiUrl = new URL(configuredApiUrl);
if (apiUrl.protocol !== "https:" || !apiUrl.pathname.replace(/\/+$/, "").endsWith("/api") ||
    apiUrl.search || apiUrl.hash || apiUrl.username || apiUrl.password) {
  throw new Error("MEDIQR_API_URL must be an HTTPS URL ending in /api without credentials, query, or fragment.");
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

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function buildDemo(outputPath) {
  const output = path.resolve(outputPath || path.join(root, "dist"));
  if (!output.startsWith(root + path.sep)) {
    throw new Error("Invalid demo build output path.");
  }

  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(path.join(output, "css"), { recursive: true });
  fs.mkdirSync(path.join(output, "js"), { recursive: true });
  fs.copyFileSync(path.join(root, "index.demo.html"), path.join(output, "index.html"));
  fs.copyFileSync(path.join(root, "css", "demo.css"), path.join(output, "css", "demo.css"));
  fs.copyFileSync(path.join(root, "js", "demo-app.js"), path.join(output, "js", "demo-app.js"));
  console.log("Built isolated MediQR demo without backend configuration.");
}

if (require.main === module) {
  buildDemo();
}

module.exports = { buildDemo };

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { buildDemo } = require("../scripts/build-demo");

const root = path.resolve(__dirname, "..");

test("demo build works without API configuration and ships only isolated assets", () => {
  const temporary = fs.mkdtempSync(path.join(root, ".demo-build-test-"));
  const output = path.join(temporary, "dist");
  const configuredApiUrl = process.env.MEDIQR_API_URL;
  delete process.env.MEDIQR_API_URL;

  try {
    buildDemo(output);
    const files = [];
    function collect(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) collect(absolute);
        else files.push(path.relative(output, absolute).replace(/\\/g, "/"));
      }
    }
    collect(output);
    files.sort();

    assert.deepEqual(files, ["css/demo.css", "index.html", "js/demo-app.js"]);
    const html = fs.readFileSync(path.join(output, "index.html"), "utf8");
    const app = fs.readFileSync(path.join(output, "js", "demo-app.js"), "utf8");
    const assets = html + "\n" + app;
    assert.match(html, /js\/demo-app\.js/);
    assert.doesNotMatch(assets, /\bMediApi\b|\bMEDIQR_CONFIG\b|MEDIQR_API_URL|fetch\s*\(|XMLHttpRequest|js\/data\/api\.js|js\/modules\/acceso\.js|\/auth\/login/i);
    assert.doesNotMatch(html, /type=["']password|name=["']password/i);
    for (const persona of ["pedro", "martin", "veronica"]) {
      assert.match(app, new RegExp(`${persona}:`));
    }
  } finally {
    if (configuredApiUrl === undefined) delete process.env.MEDIQR_API_URL;
    else process.env.MEDIQR_API_URL = configuredApiUrl;
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("demo sessions navigate synthetic modules and keep edits in memory", () => {
  const listeners = {};
  const app = { innerHTML: "", dataset: {}, addEventListener(type, listener) { listeners[type] = listener; } };
  const document = { getElementById(id) { return id === "demo-app" ? app : null; } };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "js", "demo-app.js"), "utf8"),
    { document }
  );

  function click(selector, dataset) {
    listeners.click({
      target: {
        closest(candidate) {
          return candidate === selector ? { dataset } : null;
        }
      }
    });
  }

  function enter(persona) {
    click("[data-demo-persona]", { demoPersona: persona });
    assert.match(app.innerHTML, /DEMO · datos ficticios/);
    assert.equal(app.dataset.persona, persona);
  }

  enter("pedro");
  assert.match(app.innerHTML, /Pedro Demo/);
  for (const [view, content] of [
    ["citas", /Cardiología/],
    ["consultas", /Consulta ficticia/],
    ["historial", /Asma leve/],
    ["medicamentos", /Inhalador de muestra/],
    ["qr", /No es un QR escaneable/]
  ]) {
    click("[data-demo-view]", { demoView: view });
    assert.match(app.innerHTML, content);
  }

  let prevented = false;
  listeners.submit({
    target: {
      closest(selector) {
        return selector === "[data-demo-form]"
          ? {
              dataset: { demoForm: "perfil" },
              querySelector(name) {
                return {
                  value: name.includes("firstName") ? "Pedro Editado"
                    : name.includes("lastName") ? "Demo"
                      : "000000000"
                };
              }
            }
          : null;
      }
    },
    preventDefault() { prevented = true; }
  });
  assert.equal(prevented, true);
  assert.match(app.innerHTML, /Pedro Editado/);
  assert.match(app.innerHTML, /Perfil ficticio actualizado en memoria/);

  click("[data-demo-view]", { demoView: "citas" });
  let appointmentPrevented = false;
  listeners.submit({
    target: {
      closest(selector) {
        return selector === "[data-demo-form]"
          ? {
              dataset: { demoForm: "cita" },
              querySelector(name) {
                return { value: name.includes("specialty") ? "Fisioterapia ficticia" : "2026-12-01" };
              }
            }
          : null;
      }
    },
    preventDefault() { appointmentPrevented = true; }
  });
  assert.equal(appointmentPrevented, true);
  assert.match(app.innerHTML, /Fisioterapia ficticia/);
  assert.match(app.innerHTML, /Cita ficticia agregada en memoria/);

  click("[data-demo-action]", { demoAction: "cambiar" });
  assert.match(app.innerHTML, /Entrar como Pedro/);
  enter("martin");
  assert.match(app.innerHTML, /Martin Demo/);
  assert.doesNotMatch(app.innerHTML, /Pedro Editado/);
  assert.doesNotMatch(app.innerHTML, /Fisioterapia ficticia/);
  click("[data-demo-action]", { demoAction: "cambiar" });
  enter("veronica");
  assert.match(app.innerHTML, /Verónica Demo/);
  click("[data-demo-action]", { demoAction: "cambiar" });
  enter("pedro");
  assert.match(app.innerHTML, /Pedro Demo/);
  assert.doesNotMatch(app.innerHTML, /Pedro Editado|Fisioterapia ficticia/);
});

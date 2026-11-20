"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

test("email and username login identifiers validate and normalize safely", () => {
  const window = {};
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "js", "lib", "validaciones.js"), "utf8"),
    { window }
  );
  const validation = window.MediValidaciones;

  assert.equal(validation.identificadorAcceso("patient@example.com").ok, true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(validation.identificadorAcceso("  Patient_01 "))),
    { ok: true, valor: "patient_01" }
  );
  assert.equal(validation.identificadorAcceso("a").ok, false);
  assert.equal(validation.nombreUsuario("niño").ok, false);
  assert.equal(validation.nombreUsuario("a".repeat(31)).ok, false);
});

test("login keeps the legacy email JSON key and registration sends the username", async () => {
  let sent;
  let responseStatus = 200;
  let responseBody = { token: "test" };
  const storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
  const window = { MEDIQR_CONFIG: { API_URL: "https://api.example.test/api" } };
  const fetch = async (_url, options) => {
    sent = JSON.parse(options.body);
    return {
      status: responseStatus,
      ok: responseStatus >= 200 && responseStatus < 300,
      json: async () => responseBody
    };
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "js", "data", "api.js"), "utf8"),
    { window, fetch, sessionStorage: storage, localStorage: storage, console: { warn() {} } }
  );

  await window.MediApi.auth.login("patient_01", "secret123");
  assert.deepEqual(JSON.parse(JSON.stringify(sent)), {
    email: "patient_01",
    password: "secret123"
  });

  await window.MediApi.auth.registro("patient@example.com", "secret123", "patient_01");
  assert.deepEqual(JSON.parse(JSON.stringify(sent)), {
    email: "patient@example.com",
    password: "secret123",
    username: "patient_01"
  });

  responseStatus = 401;
  responseBody = { message: "Correo/nombre de usuario o contraseña incorrectos" };
  await assert.rejects(
    window.MediApi.auth.login("unknown_01", "secret123"),
    { message: "Correo/nombre de usuario o contraseña incorrectos" }
  );
});

test("patient appointment API uses owner-scoped routes and payloads", async () => {
  const sent = [];
  const storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
  const window = { MEDIQR_CONFIG: { API_URL: "https://api.example.test/api" } };
  const fetch = async (url, options) => {
    sent.push({ url, options });
    const empty = options.method === "PATCH" && /\/cancelar$/.test(url);
    return {
      status: empty ? 204 : 200,
      ok: true,
      json: async () => ({ id: 21, estado: "PENDIENTE" })
    };
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "js", "data", "api.js"), "utf8"),
    { window, fetch, sessionStorage: storage, localStorage: storage, console: { warn() {} } }
  );
  window.MediApi.storage.setToken("patient-jwt", false);

  await window.MediApi.citas.listMine();
  await window.MediApi.citas.getMine(21);
  await window.MediApi.citas.listProfessionalsMine();
  await window.MediApi.citas.availabilityMine(7, "2027-01-02T03:04:00.000Z");
  await window.MediApi.citas.createMine({
    personalId: 7,
    fechaHora: "2027-01-02T03:04:00.000Z",
    motivo: "Control"
  });
  await window.MediApi.citas.rescheduleMine(21, "2027-01-03T03:04:00.000Z");
  await window.MediApi.citas.cancelMine(21);

  assert.deepEqual(sent.map((item) => item.url), [
    "https://api.example.test/api/citas/me",
    "https://api.example.test/api/citas/me/21",
    "https://api.example.test/api/citas/me/opciones-personal",
    "https://api.example.test/api/citas/me/disponibilidad?personalId=7&fechaHora=2027-01-02T03%3A04%3A00.000Z",
    "https://api.example.test/api/citas/me",
    "https://api.example.test/api/citas/me/21",
    "https://api.example.test/api/citas/me/21/cancelar"
  ]);
  assert.equal(sent.every((item) => item.options.headers.Authorization === "Bearer patient-jwt"), true);
  assert.deepEqual(JSON.parse(sent[4].options.body), {
    personalId: 7,
    fechaHora: "2027-01-02T03:04:00.000Z",
    motivo: "Control"
  });
  assert.deepEqual(JSON.parse(sent[5].options.body), {
    fechaHora: "2027-01-03T03:04:00.000Z"
  });
  assert.equal(sent.some((item) => /pacienteId|paciente_id/i.test(item.options.body || "")), false);
});

test("appointment DTO adapter keeps backend status labels and hides expired actions", () => {
  const window = {
    MediPartes: {},
    MediApi: { storage: { getToken: () => "patient-jwt" } },
    AccesoModulo: { sesion: { esDemo: false } }
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "js", "modules", "citas.js"), "utf8"),
    { window }
  );
  const citas = window.MediPartes.citas;
  const adapter = Object.assign({}, citas, {
    fechaISO: (date) => [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-")
  });
  const base = {
    id: 21,
    personalId: 7,
    profesional: "Dra. Demo",
    especialidad: "Medicina General",
    motivo: "",
    createdAt: null,
    updatedAt: null
  };

  const futura = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const pending = adapter.citaDesdeServidor({ ...base, fechaHora: futura, estado: "PENDIENTE" });
  assert.equal(pending.estado, "Próxima");
  assert.equal(pending.estadoEtiqueta, "Pendiente");
  assert.equal(adapter.citaEsProxima(pending), true);

  const confirmed = adapter.citaDesdeServidor({ ...base, fechaHora: futura, estado: "CONFIRMADA" });
  assert.equal(confirmed.estadoEtiqueta, "Confirmada");

  const pasada = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const expired = adapter.citaDesdeServidor({ ...base, fechaHora: pasada, estado: "PENDIENTE" });
  assert.equal(expired.estado, "Pendiente");
  assert.equal(adapter.citaEsProxima(expired), false);
});

test("documents use private multipart/blob routes and public QR resolution omits JWT", async () => {
  const requests = [];
  const blob = { kind: "document-blob" };
  class FormDataMock {
    constructor() {
      this.values = [];
    }
    append(...value) {
      this.values.push(value);
    }
  }
  const storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
  const window = { MEDIQR_CONFIG: { API_URL: "https://api.example.test/api" } };
  const fetch = async (url, options) => {
    requests.push({ url, options });
    const status = options.method === "DELETE" ? 204 : 201;
    return {
      status,
      ok: true,
      json: async () => ({ id: 11 }),
      blob: async () => blob
    };
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "js", "data", "api.js"), "utf8"),
    {
      window,
      fetch,
      FormData: FormDataMock,
      sessionStorage: storage,
      localStorage: storage,
      console: { warn() {} }
    }
  );
  window.MediApi.storage.setToken("patient-jwt", false);

  const file = { name: "resultado.pdf" };
  await window.MediApi.documentos.uploadMine(file, "Examen", "2026-11-19", 5);
  assert.equal(requests[0].url, "https://api.example.test/api/documentos/me");
  assert.equal(requests[0].options.headers.Authorization, "Bearer patient-jwt");
  assert.equal("Content-Type" in requests[0].options.headers, false);
  assert.equal(requests[0].options.body instanceof FormDataMock, true);
  assert.deepEqual(requests[0].options.body.values, [
    ["archivo", file, "resultado.pdf"],
    ["tipo", "Examen"],
    ["fechaDocumento", "2026-11-19"],
    ["citaId", "5"]
  ]);

  assert.equal(await window.MediApi.documentos.contentMine(11, true), blob);
  assert.equal(requests[1].options.headers.Authorization, "Bearer patient-jwt");
  assert.equal(requests[1].url, "https://api.example.test/api/documentos/me/11/contenido?descargar=true");

  await window.MediApi.qr.resolvePublic("A".repeat(43));
  assert.equal(requests[2].url, "https://api.example.test/api/qr-emergencia/public/resolve");
  assert.equal("Authorization" in requests[2].options.headers, false);
});

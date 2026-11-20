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

test("profile and history sync do not depend on appointment availability", async () => {
  let appointmentCalls = 0;
  const token = "patient-jwt";
  const storage = {
    getToken: () => token,
    getUser: () => ({ email: "patient@example.test", rol: "PACIENTE" })
  };
  const window = {
    MediApi: {
      storage,
      pacientes: {
        getMe: async () => ({
          id: 17,
          nombres: "Paciente",
          apellidos: "Prueba",
          fechaNacimiento: "2000-01-01"
        }),
        getEmergencyContactMe: async () => null
      },
      historial: {
        getMe: async () => ({ tipoSangre: "O+", alergias: "Polen" })
      },
      citas: {
        listMine: async () => {
          appointmentCalls += 1;
          throw new Error("appointments unavailable");
        }
      }
    },
    MediPartes: {
      fechas: {
        fechaISO: (date) => date.toISOString().slice(0, 10),
        nuevoBorrador: () => ({})
      },
      navbar: { render() {} },
      citas: { render() {} },
      documentos: {
        limpiarFiltrosDoc() {},
        documents() {},
        liberarPreviewDocumento() {}
      }
    }
  };
  const document = { getElementById: () => null };

  vm.runInNewContext(
    fs.readFileSync(path.join(root, "js", "data", "store.js"), "utf8"),
    {
      window,
      document,
      Date,
      console: { warn() {} },
      clearTimeout() {}
    }
  );

  assert.equal(await window.MediModules.cargarDatosServidor(), true);
  assert.equal(window.MediModules.paciente.id, 17);
  assert.equal(window.MediModules.historialClinico.tipoSangre, "O+");
  assert.equal(appointmentCalls, 0);
});

test("optional appointment 401 keeps the authenticated session", async () => {
  let cleared = 0;
  const storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => { cleared += 1; }
  };
  const window = { MEDIQR_CONFIG: { API_URL: "https://api.example.test/api" } };
  const fetch = async () => ({
    status: 401,
    ok: false,
    json: async () => ({ message: "unauthorized" })
  });

  vm.runInNewContext(
    fs.readFileSync(path.join(root, "js", "data", "api.js"), "utf8"),
    {
      window,
      fetch,
      sessionStorage: storage,
      localStorage: storage,
      console: { warn() {} }
    }
  );
  window.MediApi.storage.setToken("patient-jwt", false);
  cleared = 0;

  await assert.rejects(window.MediApi.citas.listMine(), { status: 401 });
  assert.equal(window.MediApi.storage.getToken(), "patient-jwt");
  assert.equal(cleared, 0);
});

test("medical documents API is disabled without sending backend requests", async () => {
  const requests = [];
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
    return {
      status: 200,
      ok: true,
      json: async () => ({ id: 11 }),
      blob: async () => ({ kind: "qr-blob" })
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
  await assert.rejects(window.MediApi.documentos.listMine(), { status: 503 });
  await assert.rejects(
    window.MediApi.documentos.uploadMine(file, "Examen", "2026-11-19", 5),
    { status: 503 }
  );
  await assert.rejects(window.MediApi.documentos.contentMine(11, true), { status: 503 });
  await assert.rejects(window.MediApi.documentos.deleteMine(11), { status: 503 });
  assert.equal(requests.length, 0);

  await window.MediApi.qr.resolvePublic("A".repeat(43));
  assert.equal(requests[0].url, "https://api.example.test/api/qr-emergencia/public/resolve");
  assert.equal("Authorization" in requests[0].options.headers, false);
});

test("medical document controls are disabled for authenticated server sessions", () => {
  let documentRequests = 0;
  let notices = 0;
  const classes = new Set();
  const elements = {
    "doc-demo-note": { classList: { add() {}, remove() {} } },
    "doc-title": { textContent: "" },
    "doc-subtitle": { textContent: "" },
    "documents-content": { innerHTML: "" },
    "doc-count": { textContent: "" }
  };
  const uploadButton = { disabled: false };
  const tabs = { classList: { add: (value) => classes.add(value), remove: (value) => classes.delete(value) } };
  const filters = { classList: { add: (value) => classes.add(value), remove: (value) => classes.delete(value) } };
  const window = {
    MediApi: {
      storage: { getToken: () => "patient-jwt" },
      documentos: { listMine: () => { documentRequests += 1; } }
    },
    AccesoModulo: { sesion: { esDemo: false } }
  };
  const document = {
    getElementById: (id) => elements[id] || null,
    querySelector(selector) {
      if (selector === '#view-documentos [data-action="documentos:form"]') return uploadButton;
      if (selector === "#view-documentos .segmented") return tabs;
      if (selector === "#view-documentos .document-filters") return filters;
      return null;
    }
  };

  vm.runInNewContext(
    fs.readFileSync(path.join(root, "js", "modules", "documentos.js"), "utf8"),
    { window, document }
  );
  const module = window.MediPartes.documentos;
  const context = Object.assign({}, module, {
    documentosServidorToken: null,
    liberarPreviewDocumento() {},
    aviso() { notices += 1; },
    documentFormServidor() { throw new Error("disabled document form opened"); }
  });

  module.documents.call(context);
  module.documentForm.call(context);

  assert.equal(uploadButton.disabled, true);
  assert.equal(classes.has("hidden"), true);
  assert.equal(elements["doc-title"].textContent, "Documentos médicos");
  assert.match(elements["documents-content"].innerHTML, /temporalmente deshabilitados/);
  assert.equal(documentRequests, 0);
  assert.equal(notices, 1);
});

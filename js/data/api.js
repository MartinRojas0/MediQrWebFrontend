// ==========================================================
// MediQR · Cliente de API HTTP
// ==========================================================
(function (global) {
  "use strict";

  const BASE_URL = (global.MEDIQR_CONFIG && global.MEDIQR_CONFIG.API_URL) || "http://localhost:8080/api";

  // Almacenamiento seguro en memoria del JWT (evita vulnerabilidad XSS en localStorage persistente).
  // Solo se almacena en memoria de sesión si el usuario no especificó recordar sesión,
  // y se descarta al cerrar la aplicación o ventana.
  let inMemoryToken = null;
  let inMemoryUser = null;

  const Storage = {
    TOKEN_KEY: "mediqr_jwt_token",
    USER_KEY: "mediqr_user_data",

    getToken: function () {
      if (inMemoryToken) return inMemoryToken;
      try {
        const token = sessionStorage.getItem(this.TOKEN_KEY);
        if (token) {
          inMemoryToken = token;
          return token;
        }
      } catch (e) {}
      return null;
    },

    setToken: function (token, persistInSession) {
      inMemoryToken = token;
      try {
        if (persistInSession) {
          sessionStorage.setItem(this.TOKEN_KEY, token);
        } else {
          sessionStorage.removeItem(this.TOKEN_KEY);
        }
      } catch (e) {}
    },

    getUser: function () {
      if (inMemoryUser) return inMemoryUser;
      try {
        const raw = sessionStorage.getItem(this.USER_KEY);
        if (raw) {
          inMemoryUser = JSON.parse(raw);
          return inMemoryUser;
        }
      } catch (e) {}
      return null;
    },

    setUser: function (user, persistInSession) {
      inMemoryUser = user;
      try {
        if (persistInSession) {
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
        } else {
          sessionStorage.removeItem(this.USER_KEY);
        }
      } catch (e) {}
    },

    clear: function () {
      inMemoryToken = null;
      inMemoryUser = null;
      try {
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
      } catch (e) {}
    }
  };

  async function request(endpoint, options) {
    const config = options || {};
    const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
    const isFormData = typeof FormData !== "undefined" && config.body instanceof FormData;
    const headers = Object.assign({
      "Content-Type": "application/json",
      "Accept": "application/json"
    }, config.headers || {});
    if (isFormData) delete headers["Content-Type"];

    const token = config.skipAuth ? null : Storage.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const fetchConfig = {
      method: config.method || "GET",
      headers: headers
    };

    if (config.body && config.method !== "GET" && config.method !== "HEAD") {
      fetchConfig.body = isFormData
        ? config.body
        : (typeof config.body === "string" ? config.body : JSON.stringify(config.body));
    }

    try {
      const response = await fetch(url, fetchConfig);

      if (response.status === 401) {
        if (endpoint === "/auth/login" || /\/auth\/login(?:\?|$)/.test(endpoint)) {
          const data = await response.json().catch(function () { return null; });
          const err = new Error((data && data.message) || "Correo/nombre de usuario o contraseña incorrectos");
          err.status = response.status;
          err.data = data;
          throw err;
        }
        if (!config.skipAuth && token) {
          Storage.clear();
          if (global.AccesoModulo && typeof global.AccesoModulo.terminar === "function") {
            global.AccesoModulo.terminar();
          }
        }
        const error = new Error("Sesión expirada o no autorizada");
        error.status = response.status;
        throw error;
      }

      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        const data = await response.json().catch(function () { return null; });
        const mensaje = (data && (data.message || data.error)) || `Error en la petición: ${response.status}`;
        const err = new Error(mensaje);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      if (config.responseType === "blob") return response.blob();
      return await response.json().catch(function () { return null; });
    } catch (error) {
      console.warn("[MediQR API Error]:", endpoint, error.message);
      throw error;
    }
  }

  const MediApi = {
    BASE_URL: BASE_URL,
    storage: Storage,

    auth: {
      login: function (identifier, password) {
        return request("/auth/login", {
          method: "POST",
          body: { email: identifier, password: password },
          skipAuth: true
        });
      },
      registro: function (email, password, username) {
        return request("/usuarios", {
          method: "POST",
          body: { email: email, password: password, username: username }
        });
      },
      me: function () {
        return request("/auth/me");
      }
    },

    pacientes: {
      getMe: function () { return request("/pacientes/me"); },
      updateMe: function (data) { return request("/pacientes/me", { method: "PUT", body: data }); },
      getEmergencyContactMe: function () { return request("/pacientes/me/contacto-emergencia"); },
      updateEmergencyContact: function (data) {
        return request("/pacientes/me/contacto-emergencia", { method: "PUT", body: data });
      },
      clearEmergencyContact: function () {
        return request("/pacientes/me/contacto-emergencia", { method: "DELETE" });
      },
      getAll: function () { return request("/pacientes"); },
      getById: function (id) { return request(`/pacientes/${id}`); },
      create: function (data) { return request("/pacientes", { method: "POST", body: data }); },
      update: function (id, data) { return request(`/pacientes/${id}`, { method: "PUT", body: data }); }
    },

    historial: {
      getMe: function () { return request("/historial-clinico/me"); },
      updateMe: function (data) { return request("/historial-clinico/me", { method: "PUT", body: data }); },
      getAll: function () { return request("/historial-clinico"); },
      getById: function (id) { return request(`/historial-clinico/${id}`); },
      create: function (data) { return request("/historial-clinico", { method: "POST", body: data }); },
      update: function (id, data) { return request(`/historial-clinico/${id}`, { method: "PUT", body: data }); }
    },

    citas: {
      getAll: function () { return request("/citas"); },
      getById: function (id) { return request(`/citas/${id}`); },
      create: function (data) { return request("/citas", { method: "POST", body: data }); },
      update: function (id, data) { return request(`/citas/${id}`, { method: "PUT", body: data }); },
      updateEstado: function (id, estado, observaciones) {
        return request(`/citas/${id}/estado`, {
          method: "PATCH",
          body: { estado: estado, observaciones: observaciones }
        });
      },
      disponibilidad: function (personalId, fechaHoraISO) {
        return request(`/citas/disponibilidad?personalId=${personalId}&fechaHora=${encodeURIComponent(fechaHoraISO)}`);
      },
      listMine: function () { return request("/citas/me"); },
      getMine: function (id) { return request(`/citas/me/${id}`); },
      listProfessionalsMine: function () { return request("/citas/me/opciones-personal"); },
      availabilityMine: function (personalId, fechaHoraISO) {
        return request(`/citas/me/disponibilidad?personalId=${encodeURIComponent(personalId)}&fechaHora=${encodeURIComponent(fechaHoraISO)}`);
      },
      createMine: function (data) { return request("/citas/me", { method: "POST", body: data }); },
      rescheduleMine: function (id, fechaHora) {
        return request(`/citas/me/${id}`, { method: "PUT", body: { fechaHora: fechaHora } });
      },
      cancelMine: function (id) { return request(`/citas/me/${id}/cancelar`, { method: "PATCH" }); }
    },

    personalSalud: {
      getAll: function () { return request("/personal-salud"); },
      getById: function (id) { return request(`/personal-salud/${id}`); }
    },

    medicamentos: {
      getAll: function () { return request("/medicamentos"); },
      getById: function (id) { return request(`/medicamentos/${id}`); },
      getByPaciente: function (pacienteId) { return request(`/medicamentos/paciente/${pacienteId}`); },
      create: function (data) { return request("/medicamentos", { method: "POST", body: data }); },
      update: function (id, data) { return request(`/medicamentos/${id}`, { method: "PUT", body: data }); },
      delete: function (id) { return request(`/medicamentos/${id}`, { method: "DELETE" }); }
    },

    recordatorios: {
      getAll: function () { return request("/recordatorios-medicamentos"); },
      getById: function (id) { return request(`/recordatorios-medicamentos/${id}`); },
      getByMedicamento: function (medicamentoId) { return request(`/recordatorios-medicamentos/medicamento/${medicamentoId}`); },
      create: function (data) { return request("/recordatorios-medicamentos", { method: "POST", body: data }); },
      update: function (id, data) { return request(`/recordatorios-medicamentos/${id}`, { method: "PUT", body: data }); },
      delete: function (id) { return request(`/recordatorios-medicamentos/${id}`, { method: "DELETE" }); }
    },

    documentos: {
      listMine: function () { return request("/documentos/me"); },
      uploadMine: function (file, tipo, fechaDocumento, citaId) {
        const formData = new FormData();
        formData.append("archivo", file, file.name);
        formData.append("tipo", tipo);
        formData.append("fechaDocumento", fechaDocumento);
        if (citaId) formData.append("citaId", String(citaId));
        return request("/documentos/me", { method: "POST", body: formData });
      },
      contentMine: function (id, descargar) {
        return request(`/documentos/me/${id}/contenido?descargar=${Boolean(descargar)}`, {
          responseType: "blob"
        });
      },
      deleteMine: function (id) {
        return request(`/documentos/me/${id}`, { method: "DELETE" });
      }
    },

    qr: {
      getByPaciente: function (pacienteId) { return request(`/qr-emergencia/paciente/${pacienteId}`); },
      create: function (data) { return request("/qr-emergencia", { method: "POST", body: data }); },
      accessEmergency: function (token) { return request(`/qr-emergencia/emergency/${token}`); },
      getMe: function () { return request("/qr-emergencia/me"); },
      issue: function (options) {
        return request("/qr-emergencia/me", { method: "POST", body: options || {} });
      },
      image: function (token) {
        return request("/qr-emergencia/me/image", {
          method: "POST",
          body: { token: token },
          responseType: "blob"
        });
      },
      revoke: function () { return request("/qr-emergencia/me", { method: "DELETE" }); },
      resolvePublic: function (token) {
        return request("/qr-emergencia/public/resolve", {
          method: "POST",
          body: { token: token },
          skipAuth: true
        });
      }
    }
  };

  global.MediApi = MediApi;
})(window);

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
    
    const headers = Object.assign({
      "Content-Type": "application/json",
      "Accept": "application/json"
    }, config.headers || {});

    const token = Storage.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const fetchConfig = {
      method: config.method || "GET",
      headers: headers
    };

    if (config.body && config.method !== "GET" && config.method !== "HEAD") {
      fetchConfig.body = typeof config.body === "string" ? config.body : JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, fetchConfig);

      if (response.status === 401) {
        Storage.clear();
        if (global.AccesoModulo && typeof global.AccesoModulo.terminar === "function") {
          global.AccesoModulo.terminar();
        }
        throw new Error("Sesión expirada o no autorizada");
      }

      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(function () { return null; });

      if (!response.ok) {
        const mensaje = (data && (data.message || data.error)) || `Error en la petición: ${response.status}`;
        const err = new Error(mensaje);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (error) {
      console.warn("[MediQR API Error]:", endpoint, error.message);
      throw error;
    }
  }

  const MediApi = {
    BASE_URL: BASE_URL,
    storage: Storage,

    auth: {
      login: function (email, password) {
        return request("/auth/login", {
          method: "POST",
          body: { email: email, password: password }
        });
      },
      registro: function (email, password, rol) {
        return request("/usuarios", {
          method: "POST",
          body: { email: email, password: password, rol: rol || "PACIENTE" }
        });
      },
      me: function () {
        return request("/auth/me");
      }
    },

    pacientes: {
      getMe: function () { return request("/pacientes/me"); },
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
      }
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

    qr: {
      getByPaciente: function (pacienteId) { return request(`/qr-emergencia/paciente/${pacienteId}`); },
      create: function (data) { return request("/qr-emergencia", { method: "POST", body: data }); },
      accessEmergency: function (token) { return request(`/qr-emergencia/emergency/${token}`); }
    }
  };

  global.MediApi = MediApi;
})(window);

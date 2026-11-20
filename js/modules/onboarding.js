// ==========================================================
// MediQR · Configuración inicial del paciente (onboarding)
//
// Flujo inicial de tres pasos. En una sesión API se guardan el perfil y los
// campos clínicos que soporta el backend y luego se vuelven a leer; el contacto
// de emergencia sigue pendiente de un contrato persistente. En modo demo, los
// datos solo se mantienen en memoria.
// ==========================================================
(function () {
  "use strict";

  const GRUPOS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

  const PASOS = [
    {
      id: "persona",
      titulo: "Datos personales",
      texto: "Para saludarte en el portal."
    },
    {
      id: "medico",
      titulo: "Información médica",
      texto: "Lo que un profesional debería saber de ti."
    },
    {
      id: "contacto",
      titulo: "Contacto de emergencia",
      texto: "A quién llamamos si te ocurre algo."
    }
  ];

  // Borrador en memoria. Se conserva al retroceder de paso y al volver a
  // abrir el flujo, para no perder lo ya escrito.
  const borrador = {
    nombre: "",
    apellidos: "",
    nacimiento: "",
    grupo: "",
    alergias: "",
    condiciones: "",
    contactoNombre: "",
    contactoParentesco: "",
    contactoTelefono: ""
  };

  let paso = 0;
  let guardando = false;

  function esc(texto) {
    return MediPartes.dom.escapar(texto);
  }

  function sesionServidor() {
    return Boolean(window.MediApi &&
      window.MediApi.storage.getToken() &&
      !(window.AccesoModulo && window.AccesoModulo.sesion.esDemo));
  }

  function separacion(texto) {
    return String(texto || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function progreso() {
    const puntos = PASOS.map(function (p, i) {
      const estado = i < paso ? "hecho" : i === paso ? "actual" : "pendiente";
      return `<li class="paso-marca paso-marca--${estado}">
        <span class="paso-num" aria-hidden="true">${i + 1}</span>
        <span class="paso-nombre">${esc(p.titulo)}</span>
      </li>`;
    }).join("");

    return `
      <nav class="pasos" aria-label="Progreso de la configuración">
        <ol class="pasos-lista">${puntos}</ol>
        <p class="text-muted pasos-cuenta">
          Paso ${paso + 1} de ${PASOS.length}</p>
      </nav>`;
  }

  function cuerpoPaso() {
    if (paso === 0) {
      return `
        <div class="onb-campos">
          <label for="onb-nombre">Nombres
            <input id="onb-nombre" type="text" autocomplete="given-name"
                   value="${esc(borrador.nombre)}" placeholder="Ana"></label>
          <label for="onb-apellidos">Apellidos
            <input id="onb-apellidos" type="text" autocomplete="family-name"
                   value="${esc(borrador.apellidos)}" placeholder="García"></label>
          <label for="onb-nacimiento" class="wide">Fecha de nacimiento
            <input id="onb-nacimiento" type="date"
                   min="1900-01-01" max="${MediPartes.fechas.hoyISO()}"
                   value="${esc(borrador.nacimiento)}"></label>
        </div>
        <p class="file-help">${sesionServidor()
          ? "Nombres y apellidos son obligatorios para guardar el perfil. La fecha es opcional."
          : "La fecha es opcional en la demostración. Si se rellena, el portal calcula la edad."}</p>`;
    }

    if (paso === 1) {
      return `
        <div class="onb-campos">
          <label for="onb-grupo">Grupo sanguíneo
            <input id="onb-grupo" list="onb-grupos" type="text"
                   value="${esc(borrador.grupo)}" placeholder="O+">
            <datalist id="onb-grupos">
              ${GRUPOS.map((g) => `<option value="${g}"></option>`).join("")}
            </datalist></label>
          <label for="onb-alergias" class="wide">Alergias
            <input id="onb-alergias" type="text" value="${esc(borrador.alergias)}"
                   placeholder="Penicilina (grave), Aspirina (leve)"></label>
          <label for="onb-condiciones" class="wide">Enfermedades o condiciones
            <input id="onb-condiciones" type="text" value="${esc(borrador.condiciones)}"
                   placeholder="Hipertensión leve"></label>
        </div>
        <p class="file-help">Separa varias con comas. Añade el nivel entre
        paréntesis: <em>Penicilina (grave)</em>.</p>`;
    }

    return `
      <div class="onb-campos">
        <label for="onb-contacto">Nombre del contacto
          <input id="onb-contacto" type="text" value="${esc(borrador.contactoNombre)}"
                 placeholder="Jorge García"></label>
        <label for="onb-parentesco">Parentesco o relación
          <input id="onb-parentesco" type="text" value="${esc(borrador.contactoParentesco)}"
                 placeholder="Hermano"></label>
        <label for="onb-telefono" class="wide">Teléfono
          <input id="onb-telefono" type="tel" value="${esc(borrador.contactoTelefono)}"
                 placeholder="+51 900 000 000"></label>
      </div>
      <p class="file-help">${sesionServidor()
        ? "El contacto se guarda de forma privada en tu cuenta y solo puede recuperarlo el paciente autenticado."
        : "En la demostración, el contacto solo vive en memoria y se pierde al recargar."}</p>`;
  }

  function acciones() {
    const atras = paso > 0
      ? `<button type="button" class="btn btn-outline" data-action="onboarding:atras">Atrás</button>`
      : "";

    // Un solo "Omitir": el paso 1 ya lo trae y volver a ponerlo al lado
    // duplicaba la misma acción dos veces en la misma pantalla.
    const siguiente = `
      <button type="button" class="btn btn-primary" data-action="onboarding:siguiente">
        ${paso < PASOS.length - 1 ? "Continuar" : "Ver resumen"}
      </button>`;

    return `
      <div class="module-actions wide onb-acciones">
        ${atras}
        <button type="button" class="btn btn-outline" data-action="onboarding:omitir">
          ${paso > 0 ? "Omitir" : "Omitir por ahora"}
        </button>
        ${siguiente}
      </div>`;
  }

  // Guarda lo escrito del paso actual. Se llama antes de avanzar, para que
  // al retroceder los datos sigan ahí. En la pantalla de resumen no hay
  // campos, asi que no hay nada que recordar.
  function recordar() {
    const campo = function (id) { return document.getElementById(id); };

    if (paso === 0) {
      if (!campo("onb-nombre")) return;
      borrador.nombre = campo("onb-nombre").value.trim();
      borrador.apellidos = campo("onb-apellidos").value.trim();
      borrador.nacimiento = campo("onb-nacimiento").value;
    } else if (paso === 1) {
      if (!campo("onb-grupo")) return;
      borrador.grupo = campo("onb-grupo").value.trim();
      borrador.alergias = campo("onb-alergias").value.trim();
      borrador.condiciones = campo("onb-condiciones").value.trim();
    } else if (paso === 2) {
      if (!campo("onb-contacto")) return;
      borrador.contactoNombre = campo("onb-contacto").value.trim();
      borrador.contactoParentesco = campo("onb-parentesco").value.trim();
      borrador.contactoTelefono = campo("onb-telefono").value.trim();
    }
  }

  function resumen() {
    const linea = function (etiqueta, valor) {
      return `<div class="onb-resumen-fila">
        <span class="onb-resumen-clave">${esc(etiqueta)}</span>
        <span class="onb-resumen-valor">${esc(valor || "Sin registrar")}</span>
      </div>`;
    };

    const alergias = separacion(borrador.alergias).join(", ");
    const condiciones = separacion(borrador.condiciones).join(", ");

    return `
      <h2 class="section-title">Revisa antes de terminar</h2>
      <div class="card onb-resumen">
        ${linea("Nombre", [borrador.nombre, borrador.apellidos].filter(Boolean).join(" "))}
        ${linea("Fecha de nacimiento",
          borrador.nacimiento ? MediPartes.fechas.fechaCorta(borrador.nacimiento) : "")}
        ${linea("Grupo sanguíneo", borrador.grupo)}
        ${linea("Alergias", alergias)}
        ${linea("Condiciones", condiciones)}
        ${linea("Contacto de emergencia",
          borrador.contactoNombre
            ? borrador.contactoNombre + " (" + borrador.contactoParentesco + ") · " + borrador.contactoTelefono
            : "")}
      </div>

      <div class="card pending-card" role="note">
        <p class="pending-head"><i data-icon="shield-halved"></i> ${sesionServidor() ? "Se guardará en tu cuenta" : "Solo en este dispositivo"}</p>
        <p>${sesionServidor()
          ? "Los datos personales, médicos y el contacto de emergencia se guardarán mediante la API."
          : "Los datos de esta demostración se mantienen solo en memoria. No se envían a ningún servicio."}</p>
      </div>

      <p id="onb-save-status" class="text-muted" role="status"></p>
      <p id="onb-save-error" class="error-msg hidden" role="alert"></p>
      <div class="module-actions wide onb-acciones">
        <button type="button" class="btn btn-outline" data-action="onboarding:atras">Atrás</button>
        <button type="button" class="btn btn-outline" data-action="onboarding:omitir">Omitir</button>
        <button id="onb-save-button" type="button" class="btn btn-primary" data-action="onboarding:finalizar">Finalizar configuración</button>
      </div>`;
  }

  function pintar() {
    const destino = document.getElementById("view-onboarding");
    if (!destino) return;

    if (paso >= PASOS.length) {
      destino.innerHTML = `
        <h1 class="heading-1" data-titulo-vista>Resumen de tu configuración</h1>
        <p class="view-lead">Un último vistazo antes de empezar.</p>
        ${resumen()}`;
      return;
    }

    const actual = PASOS[paso];
    destino.innerHTML = `
      <h1 class="heading-1" data-titulo-vista>Configura tu MediQR</h1>
      <p class="view-lead">${sesionServidor()
        ? "Nombres y apellidos son necesarios; los datos médicos son opcionales."
        : "Tardarás menos de un minuto. Todo es opcional."}</p>
      ${progreso()}

      <article class="card onb-card">
        <h2 class="section-title">${esc(actual.titulo)}</h2>
        <p class="text-muted">${esc(actual.texto)}</p>
        ${cuerpoPaso()}
        ${acciones()}
      </article>`;
  }

  function avanzar() {
    recordar();
    paso = Math.min(paso + 1, PASOS.length);
    pintar();
    const titulo = document.querySelector("#view-onboarding [data-titulo-vista]");
    if (titulo) titulo.focus({ preventScroll: true });
  }

  function atras() {
    recordar();
    paso = Math.max(paso - 1, 0);
    pintar();
  }

  // Escribe en el modelo en memoria. Salud y Contactos ya leen de ahí, así
  // que lo introducido se ve de verdad en el portal.
  // Se escriben los campos sobre el modelo, sin reemplazarlo entero.
  // Antes se asignaba un objeto nuevo, lo que borraba DNI, correo, teléfono y
  // dirección: el portal se quedaba con datos a medias y Perfil mostraba
  // campos vacíos que el paciente nunca había tocado.
  function aplicar() {
    const p = MediModules.paciente;

    if (borrador.nombre) p.nombre = borrador.nombre;
    if (borrador.apellidos) p.apellidos = borrador.apellidos;
    if (borrador.nacimiento) p.nacimiento = borrador.nacimiento;

    if (window.MediRefrescarPaciente) window.MediRefrescarPaciente();

    if (borrador.grupo) MediModules.salud.tipoSangre = borrador.grupo.toUpperCase();

    const alergias = separacion(borrador.alergias);
    if (alergias.length) {
      MediModules.salud.alergias = alergias.map(function (n) {
        const m = /^(.*?)\s*\((leve|moderada|grave)\)\s*$/i.exec(n);
        return m
          ? { nombre: m[1].trim(), severidad: m[2].toLowerCase() }
          : { nombre: n, severidad: "leve" };
      });
    }

    const condiciones = separacion(borrador.condiciones);
    if (condiciones.length) {
      MediModules.salud.condicionesCronicas = condiciones.map(function (n) {
        return { nombre: n, diagnostico: "", fechaDiagnostico: "" };
      });
    }

    if (borrador.contactoNombre && borrador.contactoTelefono) {
      MediModules.salud.contactos.push({
        id: Date.now(),
        nombre: borrador.contactoNombre,
        parentesco: borrador.contactoParentesco || "Contacto",
        telefono: borrador.contactoTelefono
      });
    }

    MediModules.resolverFechas();
    MediModules.cerrarMenus();
    if (window.SaludModulo) window.SaludModulo.refrescar();
    if (window.PerfilModulo) window.PerfilModulo.pintarContactos();
  }

  async function guardarEnServidor() {
    const paciente = MediModules.paciente || {};
    const nombres = borrador.nombre || paciente.nombre || "";
    const apellidos = borrador.apellidos || paciente.apellidos || "";
    if (!nombres.trim() || !apellidos.trim()) {
      throw new Error("Escribe nombres y apellidos para guardar el perfil.");
    }

    const perfilGuardado = await window.MediApi.pacientes.updateMe({
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      documentoIdentidad: paciente.dni || "",
      fechaNacimiento: borrador.nacimiento || paciente.nacimiento || null,
      telefono: paciente.telefono || "",
      direccion: paciente.calle || "",
      sexo: paciente.sexo || "NO_ESPECIFICADO"
    });
    if (!perfilGuardado || perfilGuardado.id == null) {
      throw new Error("El servidor no devolvió el perfil actualizado.");
    }

    const historial = MediModules.historialClinico || {};
    await MediModules.guardarHistorialServidor({
      tipoSangre: borrador.grupo.trim().toUpperCase(),
      alergias: separacion(borrador.alergias).join(", "),
      enfermedadesCronicas: separacion(borrador.condiciones).join(", "),
      cirugias: historial.cirugias || "",
      observaciones: historial.observaciones || ""
    });

    const contactoNombre = borrador.contactoNombre.trim();
    const contactoTelefono = borrador.contactoTelefono.trim();
    if ((contactoNombre && !contactoTelefono) || (!contactoNombre && contactoTelefono)) {
      throw new Error("Completa el nombre y el teléfono del contacto de emergencia.");
    }
    if (contactoNombre && contactoTelefono) {
      await window.MediApi.pacientes.updateEmergencyContact({
        nombre: contactoNombre,
        parentesco: borrador.contactoParentesco.trim(),
        telefono: contactoTelefono
      });
    }

    if (!(await MediModules.cargarDatosServidor()) ||
        !MediModules.configuracionInicialCompleta) {
      throw new Error("La API no confirmó la configuración al volver a leer los datos.");
    }
    if (contactoNombre && (
      MediModules.paciente.contactoEmergenciaNombre !== contactoNombre ||
      MediModules.paciente.contactoEmergenciaTelefono !== contactoTelefono
    )) {
      throw new Error("La API no confirmó el contacto de emergencia al volver a leerlo.");
    }
  }

  function limpiarBorrador() {
    paso = 0;
    borrador.nombre = ""; borrador.apellidos = ""; borrador.nacimiento = "";
    borrador.grupo = ""; borrador.alergias = ""; borrador.condiciones = "";
    borrador.contactoNombre = ""; borrador.contactoParentesco = ""; borrador.contactoTelefono = "";
  }

  async function finalizar() {
    if (guardando) return;
    recordar();

    if (sesionServidor()) {
      guardando = true;
      const boton = document.getElementById("onb-save-button");
      const estado = document.getElementById("onb-save-status");
      const error = document.getElementById("onb-save-error");
      if (boton) {
        boton.disabled = true;
        boton.textContent = "Guardando...";
      }
      if (estado) estado.textContent = "Guardando tu perfil y datos médicos...";
      if (error) {
        error.textContent = "";
        error.classList.add("hidden");
      }

      try {
        await guardarEnServidor();
        if (window.AccesoModulo) window.AccesoModulo.sesion.onboarding = "hecho";
        limpiarBorrador();
        MediModules.aviso("Configuración guardada en tu cuenta.");
        Router.ir("inicio");
      } catch (err) {
        if (error) {
          error.textContent = "No se pudo guardar la configuración. " +
            (err && err.status ? "La API respondió HTTP " + err.status + ". " : "") +
            (err && err.message ? err.message : "Inténtalo nuevamente.");
          error.classList.remove("hidden");
        }
        if (estado) estado.textContent = "";
      } finally {
        guardando = false;
        const botonActual = document.getElementById("onb-save-button");
        if (botonActual) {
          botonActual.disabled = false;
          botonActual.textContent = "Finalizar configuración";
        }
      }
      return;
    }

    aplicar();
    if (window.AccesoModulo) window.AccesoModulo.sesion.onboarding = "hecho";
    limpiarBorrador();

    MediModules.avisoLocal("Configuración guardada en esta demostración.");
    Router.ir("inicio");
  }

  function omitir() {
    if (window.AccesoModulo && window.AccesoModulo.estaActiva()) {
      window.AccesoModulo.sesion.onboarding = "omitido";
    }
    limpiarBorrador();
    Router.ir("inicio");
  }

  MediAcciones.definirVarias({
    "onboarding:siguiente": avanzar,
    "onboarding:atras": atras,
    "onboarding:finalizar": finalizar,
    "onboarding:omitir": omitir
  });

  // Volver al primer paso no debe arrastrar el intento anterior: el borrador
  // se vuelve a sembrar con lo que hay ahora en el modelo, que es la fuente
  // unica. Si solo se pusiera paso = 0, los datos de un intento previo
  // aparecerian ya escritos sin que nadie los hubiera puesto en esa pantalla.
  function sembrarDesdeElModelo() {
    const p = MediModules.paciente || {};
    const s = MediModules.salud || {};
    borrador.nombre = p.nombre || "";
    borrador.apellidos = p.apellidos || "";
    borrador.nacimiento = p.nacimiento || "";
    borrador.grupo = s.tipoSangre && s.tipoSangre !== "Sin grupo sanguineo"
      ? s.tipoSangre : "";
    borrador.alergias = Array.isArray(s.alergias)
      ? s.alergias.map((alergia) => alergia.nombre).filter(Boolean).join(", ")
      : s.alergias || "";
    borrador.condiciones = Array.isArray(s.condicionesCronicas)
      ? s.condicionesCronicas.map((condicion) => condicion.nombre).filter(Boolean).join(", ")
      : s.condiciones || "";
    const contacto = Array.isArray(s.contactos) ? s.contactos[0] : null;
    borrador.contactoNombre = p.contactoEmergenciaNombre || contacto && contacto.nombre || "";
    borrador.contactoParentesco = p.contactoEmergenciaParentesco || contacto && contacto.parentesco || "";
    borrador.contactoTelefono = p.contactoEmergenciaTelefono || contacto && contacto.telefono || "";
  }

  window.OnboardingModulo = {
    render: function () { paso = 0; sembrarDesdeElModelo(); pintar(); },
    reiniciar: function () { paso = 0; sembrarDesdeElModelo(); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pintar);
  } else {
    pintar();
  }
})();
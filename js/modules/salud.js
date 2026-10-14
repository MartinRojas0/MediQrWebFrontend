// ==========================================================
// MediQR · Vista Salud (Expediente clínico)
//
// Fuente de verdad: FragmentoSalud.java y res/layout/fragment_salud.xml
// de la app movil.
//
// El movil agrupa el expediente en tres bloques y muestra una tarjeta de
// alerta cuando las alergias contienen un termino critico:
//
//   Información vital   -> grupo sanguíneo, alergias
//   Tratamientos       -> medicamentos actuales, condiciones cronicas
//   Antecedentes       -> vacunas, cirugias
//
// Se conserva esa division y la misma regla de alerta:
// si alguna alergia contiene "grave", "penicilina" o "anafil".
// ==========================================================
(function () {
  "use strict";

  const TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // FragmentoSalud.cargarDatos(): la tarjeta de riesgo aparece si las
  // alergias mencionan una alergia grave o una sustancia de riesgo.
  const CRITICOS = ["grave", "penicilina", "anafil"];

  function tieneAlertaCritica(salud) {
    const texto = (salud.alergias || [])
      .map((a) => (typeof a === "string" ? a : a.nombre))
      .join(" ")
      .toLowerCase();

    return CRITICOS.some((c) => texto.includes(c));
  }

  function nombresAlergia(a) {
    return typeof a === "string" ? a : a.nombre;
  }

  // Los antecedentes se guardan en ISO, que no es un formato para leer. Se
  // muestra como el resto del portal (DD/MM/AAAA) y se deja intacto si el
  // dato no es una fecha completa.
  function fechaLegible(fecha) {
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) return fecha || "";
    return MediPartes.fechas.fechaCorta(fecha);
  }

  function listaTexto(lista, construir) {
    if (!lista || lista.length === 0) return "No especificado";
    return lista.map(construir).join(", ");
  }

  function fila(icono, etiqueta, valor, accion, dataset) {
    const attrs = dataset
      ? Object.keys(dataset).map((k) => ` data-${k}="${dataset[k]}"`).join("")
      : "";

    return `
      <button type="button" class="info-row-item" data-action="${accion}"${attrs}>
        <span class="row-icon"><i data-icon="${icono}"></i></span>
        <span class="row-body">
          <span class="label-secondary">${etiqueta}</span>
          <span class="value-primary row-value">${MediPartes.dom.escapar(valor)}</span>
        </span>
        <span class="row-icon row-chevron" aria-hidden="true"><i data-icon="chevron-right"></i></span>
      </button>`;
  }

  function render() {
    const destino = document.getElementById("view-salud");
    if (!destino || destino.dataset.renderizado === "1") return;

    const salud = MediModules.salud;

    const alerta = tieneAlertaCritica(salud)
      ? `
        <div class="critical-alert" role="alert">
          <i data-icon="triangle-exclamation"></i>
          <span>Alergia crítica: ${MediPartes.dom.escapar(listaTexto(salud.alergias, (a) =>
            (a.severidad ? a.nombre + " (" + a.severidad + ")" : a.nombre)))}</span>
        </div>`
      : "";

    destino.innerHTML = `
      <h1 data-titulo-vista class="heading-1">Expediente Clínico</h1>
      <p class="text-muted">Información médica y antecedentes vitales</p>

      ${alerta}

      <h2 class="section-title">Información Vital</h2>
      ${fila("heart-pulse", "Grupo Sanguíneo", salud.tipoSangre || "No especificado", "salud:elegir-sangre")}
      ${fila("file-medical", "Alergias",
        listaTexto(salud.alergias, (a) => (a.severidad ? a.nombre + " (" + a.severidad + ")" : a.nombre)),
        "salud:editar", { campo: "alergias" })}

      <h2 class="section-title">Tratamientos Actuales</h2>
      ${fila("pills", "Medicamentos Actuales",
        listaTexto(salud.medicamentosActuales, (m) => m.nombre + " " + m.dosis + " · " + m.frecuencia),
        "salud:editar", { campo: "medicamentosActuales" })}
      ${fila("history", "Condiciones Crónicas",
        listaTexto(salud.condicionesCronicas, (c) => c.nombre),
        "salud:editar", { campo: "condicionesCronicas" })}

      <h2 class="section-title">Antecedentes Clínicos</h2>
      ${fila("shield-halved", "Vacunas",
        listaTexto(salud.vacunas, (v) => v.nombre + " (" + v.dosis + ")"),
        "salud:editar", { campo: "vacunas" })}
      ${fila("folder-open", "Cirugías",
        listaTexto(salud.cirugias, (c) => c.nombre + " · " + fechaLegible(c.fecha)),
        "salud:editar", { campo: "cirugias" })}
    `;

    destino.dataset.renderizado = "1";
  }

  // --- edicion ---
  // FragmentoSalud.mostrarDialogoEdicion() abre un dialogo simple con el
  // valor actual y guarda tras confirmar.
  function editar(campo) {
    const salud = MediModules.salud;
    const ETIQUETAS = {
      alergias: "Alergias",
      medicamentosActuales: "Medicamentos",
      condicionesCronicas: "Condiciones Crónicas",
      vacunas: "Vacunas",
      cirugias: "Cirugías"
    };

    const actual = listaTexto(salud[campo], (x) => x.nombre || x);
    const ayuda = {
      alergias: "Separa varias con comas. Sin números.",
      medicamentosActuales: "Separa varios con comas.",
      condicionesCronicas: "Separa varias con comas.",
      vacunas: "Separa varias con comas.",
      cirugias: "Separa varias con comas."
    }[campo];

    MediModules.modal("Actualizar " + ETIQUETAS[campo], `
      <form id="salud-form" class="module-form" novalidate data-action="salud:guardar">
        <label class="wide">${ETIQUETAS[campo]}:
          <input name="valor" type="text" value="${MediPartes.dom.atributo(actual)}" required>
        </label>
        <p class="file-help wide">${ayuda}</p>
        <p id="salud-error" class="error-msg wide" role="alert"></p>
        <div class="module-actions wide">
          <button type="submit" class="btn btn-primary">Guardar</button>
          <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cancelar</button>
        </div>
      </form>
    `);

    document.getElementById("salud-form").onsubmit = (evento) => {
      evento.preventDefault();
      confirmarGuardar(campo, evento.target.valor.value.trim());
    };
  }

  // FragmentoSalud.mostrarDialogoSangre(): lista cerrada de tipos.
  function elegirSangre() {
    MediModules.modal("Seleccionar Tipo de Sangre", `
      <div class="choice-grid">
        ${TIPOS_SANGRE.map((t) => `
          <label class="choice">
            <input type="radio" name="sangre" value="${t}" ${MediModules.salud.tipoSangre === t ? "checked" : ""}>
            <span>${t}</span>
          </label>`).join("")}
      </div>
      <div class="module-actions">
        <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cancelar</button>
        <button type="button" class="btn btn-primary" data-action="salud:confirmar-sangre">Confirmar</button>
      </div>
    `, true);
  }

  // FragmentoSalud.confirmarGuardar(): pide confirmacion antes de escribir.
  function confirmarGuardar(campo, valor) {
    if (!valor) {
      document.getElementById("salud-error").textContent = "El campo no puede quedar vacío.";
      return;
    }

    MediModules.modal("Confirmar Cambios", `
      <p>¿Estás seguro de actualizar tu información médica?</p>
      <div class="module-actions">
        <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cancelar</button>
        <button type="button" class="btn btn-primary"
          data-action="salud:aplicar" data-campo="${campo}" data-valor="${MediPartes.dom.atributo(valor)}">Confirmar</button>
      </div>
    `, true);
  }

  // Convierte el texto editado en la estructura que espera el modelo movil.
  function aplicar(campo, texto) {
    const partes = texto.split(",").map((s) => s.trim()).filter(Boolean);

    if (campo === "alergias") {
      MediModules.salud.alergias = partes.map((n) => {
        // "Penicilina (grave)" conserva la severidad si el usuario la escribe.
        const m = /^(.*?)\s*\((leve|moderada|grave)\)\s*$/i.exec(n);
        return m ? { nombre: m[1].trim(), severidad: m[2].toLowerCase() } : { nombre: n, severidad: "leve" };
      });
    } else if (campo === "condicionesCronicas") {
      MediModules.salud.condicionesCronicas = partes.map((n) => ({ nombre: n, diagnostico: "", fechaDiagnostico: "" }));
    } else if (campo === "medicamentosActuales") {
      MediModules.salud.medicamentosActuales = partes.map((n) => ({
        nombre: n, dosis: "", frecuencia: "", fechaInicio: "", fechaFin: null
      }));
    } else if (campo === "vacunas") {
      MediModules.salud.vacunas = partes.map((n) => ({ nombre: n, fechaAplicacion: "", dosis: 1 }));
    } else if (campo === "cirugias") {
      MediModules.salud.cirugias = partes.map((n) => ({ nombre: n, fecha: "", hospital: "" }));
    }

    refrescar();
    // Tras confirmar, el dialogo se cierra: si se dejaba abierto el
    // paciente quedaba atrapado en una pantalla ya cumplida.
    MediModules.close();
    MediModules.avisoLocal("Información médica actualizada.");
  }

  function confirmarSangre(tipo) {
    MediModules.salud.tipoSangre = tipo;
    refrescar();
    // Tras confirmar, el dialogo se cierra: si se dejaba abierto el
    // paciente quedaba atrapado en una pantalla ya cumplida.
    MediModules.close();
    MediModules.avisoLocal("Información médica actualizada.");
  }

  function refrescar() {
    const destino = document.getElementById("view-salud");
    if (!destino) return;

    destino.dataset.renderizado = "";
    render();
  }

  MediAcciones.definirVarias({
    "salud:editar": function (el) { editar(el.dataset.campo); },
    "salud:elegir-sangre": function () { elegirSangre(); },
    "salud:confirmar-sangre": function () {
      const elegida = document.querySelector('#module-dialog input[name="sangre"]:checked');
      if (elegida) confirmarSangre(elegida.value);
      else MediModules.close();
    },
    "salud:aplicar": function (el) { aplicar(el.dataset.campo, el.dataset.valor); },
    "salud:guardar": function (el, evento) { confirmarGuardar(el.dataset.campo, evento.target.valor.value.trim()); }
  });

  window.SaludModulo = { render, tieneAlertaCritica, refrescar };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();

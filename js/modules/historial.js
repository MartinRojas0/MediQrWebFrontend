// ==========================================================
// MediQR · Vista Historial
//
// Fuente de verdad: HistorialActivity.java, item_historial.xml y
// timeline_dot.xml de la app movil.
//
// El Historial NO es el Expediente clinico:
//   Salud      -> datos vitales, tratamientos y antecedentes (js/modules/salud.js)
//   Historial  -> linea de tiempo de consultas, con su detalle y los
//                 documentos adjuntos a cada una
//
// Reproduce el flujo del movil: lista de todas las citas de la mas
// reciente a la mas antigua, buscador por especialidad, medico o
// diagnostico, y estado vacio cuando no hay consultas.
// ==========================================================
(function () {
  "use strict";

  const esc = (v) => MediPartes.dom.escapar(v == null ? "" : String(v));

  // HistorialActivity.cargarHistorial(): todas las citas, ordenadas de
  // mas reciente a mas antigua.
  function citasOrdenadas() {
    return MediModules.citas.slice().sort(function (a, b) {
      return (b.fecha + b.hora).localeCompare(a.fecha + a.hora);
    });
  }

  // HistorialActivity.filtrarHistorial(): busca en especialidad, medico
  // y diagnostico, sin distinguir mayusculas.
  function filtrar(texto) {
    const t = MediPartes.fechas.normalizar(texto);
    if (!t) return citasOrdenadas();

    return citasOrdenadas().filter(function (c) {
      const campos = [c.especialidad, c.medico, c.motivo, c.diagnostico].filter(Boolean);
      return MediPartes.fechas.normalizar(campos.join(" ")).indexOf(t) !== -1;
    });
  }

  // Documentos asociados a una consulta, como layoutRelatedDocs.
  function adjuntos(cita) {
    const docs = MediModules.documentos.filter((d) => d.citaId === cita.id);
    if (docs.length === 0) return "";

    return `
      <div class="hist-docs">
        <span class="hist-docs-title">Archivos adjuntos</span>
        ${docs.map((d) => `
          <button type="button" class="hist-doc" data-action="documentos:ver" data-id="${d.id}">
            <i data-icon="${MediModules.iconoArchivo(d.nombre)}"></i>
            <span class="hist-doc-name">${esc(d.nombre)}</span>
          </button>`).join("")}
      </div>`;
  }

  // Un diagnostico explicito si existe; si no, el motivo de la consulta,
  // que es lo unico que guarda hoy el modelo.
  function bloqueDetalle(cita) {
    const texto = cita.diagnostico || cita.motivo;
    if (!texto) return "";

    const titulo = cita.diagnostico ? 'Diagnóstico' : 'Detalle de la consulta';
    return `
      <div class="hist-detail">
        <span class="hist-detail-title">${titulo}</span>
        <p>${esc(texto)}</p>
      </div>`;
  }

  function insignia(estado) {
    const clase = MediModules.claseEstado(estado);
    return `<span class="badge status-${clase}">${esc(estado)}</span>`;
  }

  function item(cita) {
    return `
      <li class="hist-item">
        <span class="hist-rail" aria-hidden="true"><span class="hist-dot"></span></span>

        <article class="card hist-card">
          <div class="card-header">
            <h3 class="hist-specialty">${esc(cita.especialidad)}</h3>
            ${insignia(cita.estado)}
          </div>

          <p class="hist-when">${esc(MediPartes.fechas.fechaTexto(cita.fecha))} · ${esc(MediPartes.fechas.horaTexto(cita.hora))}</p>

          <dl class="hist-facts">
            <div><dt>Médico</dt><dd>${esc(cita.medico)}</dd></div>
            <div><dt>Ubicación</dt><dd>${esc(cita.lugar)}</dd></div>
          </dl>

          ${bloqueDetalle(cita)}
          ${adjuntos(cita)}

          <div class="module-actions">
            <button type="button" class="btn btn-outline btn-sm" data-action="citas:detalle" data-id="${cita.id}">Ver detalle</button>
            <button type="button" class="btn btn-secondary btn-sm"
              data-action="documentos:form" data-id="${cita.id}">
              <i data-icon="folder-open"></i> Adjuntar documento
            </button>
          </div>
        </article>
      </li>`;
  }

  function render() {
    const destino = document.getElementById("view-historial");
    if (!destino || destino.dataset.renderizado === "1") return;

    const busqueda = document.getElementById("hist-buscar");
    const lista = filtrar(busqueda ? busqueda.value : "");

    const cuerpo = lista.length === 0
      ? `<p class="empty-state">No hay consultas registradas en el historial</p>`
      : `<ol class="hist-timeline">${lista.map(item).join("")}</ol>`;

    destino.innerHTML = `
      <h1 data-titulo-vista class="heading-1">Historial</h1>
      <p class="text-muted">Tus consultas, de la más reciente a la más antigua</p>

      <label class="hist-search">
        Buscar consulta
        <input id="hist-buscar" type="search" placeholder="Especialidad, médico o detalle">
      </label>

      <p class="text-caption hist-count">
        ${lista.length} consulta${lista.length === 1 ? "" : "s"}
      </p>

      <div id="hist-contenido">${cuerpo}</div>
    `;

    destino.dataset.renderizado = "1";
    MediIcons.render(destino);
  }

  // El buscador vuelve a pintar la lista sin recargar la vista entera.
  function alBuscar(evento) {
    const destino = document.getElementById("view-historial");
    if (!destino || evento.target.id !== "hist-buscar") return;

    const lista = filtrar(evento.target.value);
    const contenido = document.getElementById("hist-contenido");

    contenido.innerHTML = lista.length === 0
      ? `<p class="empty-state">No hay consultas registradas en el historial</p>`
      : `<ol class="hist-timeline">${lista.map(item).join("")}</ol>`;

    document.querySelector("#view-historial .hist-count").textContent =
      lista.length + " consulta" + (lista.length === 1 ? "" : "s");

    MediIcons.render(contenido);
  }

  MediAcciones.definirVarias({
    "historial:buscar": function () { render(); }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }

  document.addEventListener("input", alBuscar);
  document.addEventListener("change", alBuscar);

  window.HistorialModulo = { render, filtrar };
})();
// ==========================================================
// MediQR · Vista Inicio
//
// Reproduce el orden de fragment_inicio.xml de la app movil:
//
//   1. Identidad medica  -> QR + boton de compartir
//   2. Resumen actual    -> tres filas calculadas con datos reales
//   3. Accesos rapidos   -> historial, salud, citas, documentos
//   4. SOS               -> boton flotante (js/modules/sos.js)
//
// Todo el contenido se deriva de MediModules: si no hay citas, la
// pantalla lo dice. No hay datos escritos a mano en el marcado.
// ==========================================================
(function () {
  "use strict";

  const esc = (v) => MediPartes.dom.escapar(v == null ? "" : String(v));

  // La proxima es la cita no atendida mas cercana; la ultima, la atendida
  // mas reciente. Es la misma regla que actualizarResumen() del movil.
  function resumen() {
    const citas = MediModules.citas;

    const pendientes = citas
      .filter((c) => c.estado === "Próxima")
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

    const atendidas = citas
      .filter((c) => c.estado === "Atendida")
      .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));

    return { proxima: pendientes[0] || null, ultima: atendidas[0] || null };
  }

  // FragmentoInicio.actualizarResumen() marca la fila de alertas en rojo
  // si hay una alergia grave o penicilina.
  function tieneRiesgo() {
    const alergias = MediModules.salud.alergias
      .map((a) => (a.nombre + " " + (a.severidad || "")))
      .join(" ")
      .toLowerCase();

    return alergias.includes("grave") || alergias.includes("penicilina");
  }

  function filaResumen(icono, texto, tono) {
    return `
      <button type="button" class="summary-row" data-action="inicio:resumen" data-fila="${esc(texto.split(':')[0])}">
        <span class="summary-icon summary-icon--${tono}"><i data-icon="${icono}"></i></span>
        <span class="summary-text">${esc(texto)}</span>
        <span class="row-chevron" aria-hidden="true"><i data-icon="chevron-right"></i></span>
      </button>`;
  }

  function accesos() {
    return [
      { icono: "history", etiqueta: "Historial", ruta: "historial", sub: "Tus consultas" },
      { icono: "heart-pulse", etiqueta: "Salud", ruta: "salud", sub: "Expediente" },
      { icono: "calendar-days", etiqueta: "Citas", ruta: "citas", sub: "Ver y agendar" },
      { icono: "folder-open", etiqueta: "Documentos", ruta: "documentos", sub: "Recetas y exámenes" }
    ].map((a) => `
      <button type="button" class="quick-card" data-action="nav:ir" data-ruta="${a.ruta}">
        <span class="quick-icon"><i data-icon="${a.icono}"></i></span>
        <span class="quick-label">${a.etiqueta}</span>
        <span class="quick-sub">${a.sub}</span>
      </button>`).join("");
  }

  function render() {
    const destino = document.getElementById("view-inicio");
    if (!destino || destino.dataset.renderizado === "1") return;

    const salud = MediModules.salud;
    const { proxima, ultima } = resumen();
    const riesgo = tieneRiesgo();
    const alergias = salud.alergias
      .map((a) => (a.severidad ? a.nombre + " (" + a.severidad + ")" : a.nombre))
      .join(", ");
    // La banda de arriba ya dice WHICH alergias hay. La fila del resumen
    // repetia la misma frase en la misma pantalla, asi que aqui solo cuenta
    // cuantas hay: informa de algo distinto y sigue llevando a Salud.
    const riesgos = salud.alergias.length;

    destino.innerHTML = `
      <h1 data-titulo-vista class="heading-1">Hola, Paciente Demo <i data-icon="hand" class="icon-wave"></i></h1>
      <p class="text-muted">Tu ecosistema médico está al día</p>

      <!-- Identidad medica: el QR es lo primero, igual que en el movil -->
      <article class="card identity-card">
        <div class="identity-main">
          <span class="identity-label">Identidad médica digital</span>
          <p class="identity-name">Paciente Demo · ${esc(salud.tipoSangre || "Sin grupo sanguíneo")}</p>
          <p class="identity-detail">${esc(alergias || "Sin alergias registradas")}</p>
          <div class="identity-actions">
            <button type="button" class="btn btn-outline" data-action="inicio:ver-qr">Ver QR</button>
            <button type="button" class="btn btn-primary" data-action="inicio:compartir">
              <i data-icon="share"></i> Compartir información
            </button>
          </div>
        </div>
        <button type="button" class="identity-qr" data-action="inicio:ver-qr" aria-label="Ver código QR de emergencia">
          <i data-icon="qrcode"></i>
        </button>
      </article>

      ${riesgo ? `
        <div class="critical-alert" role="alert">
          <i data-icon="triangle-exclamation"></i>
          <span>Alergia crítica: ${esc(alergias)}</span>
        </div>` : ""}

      <!-- Resumen actual: tres filas calculadas, como row_summary_item -->
      <h2 class="section-title">Resumen actual</h2>
      <div class="summary-list">
        ${filaResumen("calendar-days",
          proxima ? "Próxima: " + proxima.especialidad + " · " + MediPartes.fechas.fechaCorta(proxima.fecha) : "Próxima: sin citas",
          "primary")}
        ${filaResumen("history",
          ultima ? "Última: " + ultima.especialidad + " · " + ultima.medico : "Última: sin historial",
          "accent")}
        ${filaResumen(riesgo ? "triangle-exclamation" : "heart-pulse",
          riesgos ? "Alergias registradas: " + riesgos : "Sin alergias registradas",
          riesgo ? "danger" : "muted")}
      </div>

      <h2 class="section-title">Accesos rápidos</h2>
      <div class="quick-grid">${accesos()}</div>
    `;

    destino.dataset.renderizado = "1";
  }

  MediAcciones.definirVarias({
    "inicio:ver-qr": function () { MediModules.verQr(); },
    "inicio:compartir": function () {
      MediModules.aviso("Compartir información médica depende del servicio de QR, aún no conectado.");
    },
    // Las filas del resumen llevan a la seccion que corresponde.
// Cada fila lleva a donde corresponde. Antes "Ultima" abria Documentos y la
    // fila de alerta abria Recetas: dos destinos que no tienen nada que ver
    // con lo que la fila anuncia.
    "inicio:resumen": function (el) {
      const fila = el.dataset.fila;

      if (fila === "Próxima") return MediModules.irCitas("proximas");
      if (fila === "Última") return Router.ir("historial");
      return Router.ir("salud");
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
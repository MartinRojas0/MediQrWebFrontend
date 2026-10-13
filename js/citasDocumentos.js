// ==========================================================
// MediQR · Citas + Documentos
// ==========================================================

// Navegación del menú principal
function switchSection(section) {
  const vista = document.getElementById("view-" + section);

  if (!vista) return;

  document.querySelectorAll(".view-section").forEach(function (elemento) {
    elemento.classList.add("hidden");
  });

  document.querySelectorAll(".nav-links a").forEach(function (enlace) {
    enlace.classList.remove("active");
  });

  vista.classList.remove("hidden");

  const enlaceActivo = document.getElementById("nav-" + section);

  if (enlaceActivo) {
    enlaceActivo.classList.add("active");
  }

  if (typeof MediModules !== "undefined") {
    MediModules.cerrarMenus();

    if (section === "citas") {
      MediModules.render();
    }

    if (section === "documentos") {
      MediModules.documents();
    }
  }
}

const MediModules = {
  /* ------------------------------------------------------
     DATOS FICTICIOS
  ------------------------------------------------------ */
  lugares: {
    "Clínica Dental MediQR": "Av. Javier Prado Este 1234, San Borja",
    "Clínica MediSalud": "Av. Arequipa 2450, Lince",
    "Centro Médico San Miguel": "Av. La Marina 2230, San Miguel",
    "Hospital Central MediQR": "Av. Salaverry 3100, Jesús María"
  },

  medicos: {
    "Medicina General": ["Dra. Ana Martínez", "Dr. Luis Torres"],
    "Odontología": ["Dr. Carlos Pérez", "Dra. Rosa Quispe"],
    "Cardiología": ["Dra. Lucía Ramos", "Dr. Jorge Salazar"],
    "Dermatología": ["Dr. Diego Flores"],
    "Oftalmología": ["Dra. Patricia Vega"],
    "Pediatría": ["Dr. Mateo Rojas"]
  },

  // "desp" = días de diferencia respecto a hoy (se convierte en fecha real)
  citas: [
    { id: 1, especialidad: "Odontología", medico: "Dr. Carlos Pérez", desp: 2, hora: "10:30", lugar: "Clínica Dental MediQR", estado: "Próxima", motivo: "Limpieza dental y control de caries." },
    { id: 2, especialidad: "Cardiología", medico: "Dra. Lucía Ramos", desp: 7, hora: "15:00", lugar: "Centro Médico San Miguel", estado: "Próxima", motivo: "Control de presión arterial." },
    { id: 3, especialidad: "Medicina General", medico: "Dra. Ana Martínez", desp: -14, hora: "09:00", lugar: "Clínica MediSalud", estado: "Atendida", motivo: "Malestar general y congestión nasal." },
    { id: 4, especialidad: "Odontología", medico: "Dr. Carlos Pérez", desp: -20, hora: "11:00", lugar: "Clínica Dental MediQR", estado: "Atendida", motivo: "Dolor en una muela." },
    { id: 5, especialidad: "Dermatología", medico: "Dr. Diego Flores", desp: -5, hora: "16:00", lugar: "Clínica MediSalud", estado: "Cancelada", motivo: "" },
    { id: 6, especialidad: "Dermatología", medico: "Dr. Diego Flores", desp: -45, hora: "10:00", lugar: "Clínica MediSalud", estado: "Atendida", motivo: "Revisión de alergia en la piel." },
    { id: 7, especialidad: "Cardiología", medico: "Dra. Lucía Ramos", desp: -60, hora: "08:30", lugar: "Centro Médico San Miguel", estado: "Atendida", motivo: "Chequeo cardiológico anual." },
    { id: 8, especialidad: "Medicina General", medico: "Dr. Luis Torres", desp: 0, hora: "16:00", lugar: "Clínica MediSalud", estado: "Próxima", motivo: "Control de rutina." },
    { id: 9, especialidad: "Dermatología", medico: "Dr. Diego Flores", desp: 7, hora: "09:00", lugar: "Clínica MediSalud", estado: "Próxima", motivo: "" }
  ],

  documentos: [
    { id: 1, nombre: "Receta_consulta_general.pdf", tipo: "Receta", citaId: 3 },
    { id: 2, nombre: "Hemograma_completo.pdf", tipo: "Examen", subtipo: "Análisis de laboratorio", citaId: 3 },
    { id: 3, nombre: "Informe_control_medico.pdf", tipo: "Informe", citaId: 3 },
    { id: 4, nombre: "Constancia_atencion.pdf", tipo: "Otro", subtipo: "Constancia", citaId: 3 },
    { id: 5, nombre: "Radiografia_dental.jpg", tipo: "Examen", subtipo: "Radiografía", citaId: 4 },
    { id: 6, nombre: "Receta_dermatologia.pdf", tipo: "Receta", citaId: 6 },
    { id: 7, nombre: "Informe_cardiologico.pdf", tipo: "Informe", citaId: 7 },
    { id: 8, nombre: "Electrocardiograma.png", tipo: "Examen", subtipo: "Imágenes médicas", citaId: 7 },
    { id: 9, nombre: "Comprobante_seguro.pdf", tipo: "Otro", subtipo: "Seguro médico", citaId: null, desp: -30 }
  ],

  vistasDoc: {
    Todos: { tipo: null, titulo: "Mis documentos", subtitulo: "Tus recetas, exámenes e informes en un solo lugar." },
    Recetas: { tipo: "Receta", titulo: "Recetas médicas", subtitulo: "Recetas indicadas por tus médicos." },
    "Exámenes": { tipo: "Examen", titulo: "Exámenes médicos", subtitulo: "Análisis de laboratorio, radiografías, imágenes y resultados." },
    Informes: { tipo: "Informe", titulo: "Informes médicos", subtitulo: "Informes emitidos después de tus consultas." },
    Otros: { tipo: "Otro", titulo: "Otros documentos", subtitulo: "Documentos que no son recetas, exámenes ni informes." }
  },

  /* ------------------------------------------------------
     ESTADO DE LA PANTALLA
  ------------------------------------------------------ */
  pestaña: "calendario",
  docVista: "Todos",
  mes: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  diaSeleccionado: "",
  borrador: null,
  citaPendiente: null,
  temporizadorAviso: null,

  iniciar() {
    const hoy = new Date();

    this.citas.forEach((cita) => {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + cita.desp);
      cita.fecha = this.fechaISO(fecha);
      cita.direccion = this.lugares[cita.lugar];
      delete cita.desp;
    });

    this.documentos.forEach((doc) => {
      const cita = this.citas.find((c) => c.id === doc.citaId);

      if (cita) {
        doc.fecha = cita.fecha;
      } else {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() + doc.desp);
        doc.fecha = this.fechaISO(fecha);
      }

      delete doc.desp;
    });

    this.diaSeleccionado = this.fechaISO(hoy);
    this.borrador = this.nuevoBorrador();
  },

  /* ------------------------------------------------------
     UTILIDADES
  ------------------------------------------------------ */
  fechaISO(fecha) {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${año}-${mes}-${dia}`;
  },

  hoyISO() {
    return this.fechaISO(new Date());
  },

  // 18 de septiembre de 2026
  fechaTexto(fecha) {
    return new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  },

  // 20/09/2026
  fechaCorta(fecha) {
    const [año, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${año}`;
  },

  // 10:30 a. m.
  horaTexto(hora) {
    const [h, m] = hora.split(":").map(Number);
    const sufijo = h >= 12 ? "p. m." : "a. m.";
    const h12 = h % 12 || 12;

    return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
  },

  escapar(texto) {
    const elemento = document.createElement("span");
    elemento.textContent = texto ?? "";
    return elemento.innerHTML;
  },

  atributo(texto) {
    return this.escapar(texto).replace(/"/g, "&quot;");
  },

  normalizar(texto) {
    return String(texto)
      .toLocaleLowerCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  },

  claseEstado(estado) {
    return { "Próxima": "proxima", "Atendida": "atendida", "Cancelada": "cancelada" }[estado] || "proxima";
  },

  insignia(estado) {
    return `<span class="badge status-${this.claseEstado(estado)}">${this.escapar(estado)}</span>`;
  },

  // Lista de información en columna: [[etiqueta, valor, esHTML?], ...]
  filas(lista) {
    return `
      <div class="info-list">
        ${lista
          .filter(Boolean)
          .map(([etiqueta, valor, html]) => `
            <div class="info-row">
              <span class="info-label">${etiqueta}</span>
              <span class="info-value">${html ? valor : this.escapar(valor)}</span>
            </div>
          `)
          .join("")}
      </div>
    `;
  },

  buscarCita(id) {
    return this.citas.find((c) => c.id === id);
  },

  tituloVista(titulo, subtitulo) {
    return `
      <div class="view-title">
        <h2>${titulo}</h2>
        <p class="text-muted">${subtitulo}</p>
      </div>
    `;
  },

  /* ------------------------------------------------------
     MENÚS DESPLEGABLES Y NAVEGACIÓN INTERNA
  ------------------------------------------------------ */
  toggleMenu(evento, elemento) {
    evento.stopPropagation();

    const contenedor = elemento.parentElement;
    const conMouse = window.matchMedia("(hover: hover)").matches;
    const visible =
      getComputedStyle(contenedor.querySelector(".nav-submenu")).display !== "none";

    // Con mouse el menú ya se abre al pasar encima; en pantallas táctiles se alterna
    const abrir = conMouse ? true : !visible;

    this.cerrarMenus();
    contenedor.classList.remove("cerrado");
    contenedor.classList.toggle("open", abrir);
    elemento.setAttribute("aria-expanded", abrir);
  },

  cerrarMenus() {
    document.querySelectorAll(".nav-dropdown").forEach((menu) => {
      menu.classList.remove("open");

      // Si el mouse sigue encima, ocultarlo hasta que salga del menú
      if (menu.matches(":hover")) {
        menu.classList.add("cerrado");
      }

      const disparador = menu.querySelector(".nav-trigger");
      if (disparador) disparador.setAttribute("aria-expanded", "false");
    });
  },

  marcarMenu() {
    const actual = { citas: this.pestaña, documentos: this.docVista };

    document.querySelectorAll("[data-menu]").forEach((boton) => {
      const seccion = boton.dataset.menu;
      const visible = !document
        .getElementById("view-" + seccion)
        .classList.contains("hidden");

      boton.classList.toggle(
        "active",
        visible && boton.dataset.vista === actual[seccion]
      );
    });
  },

  irCitas(vista) {
    this.pestaña = vista;
    this.close();
    switchSection("citas");
  },

  irDocumentos(vista) {
    if (vista !== this.docVista) {
      this.limpiarFiltrosDoc();
    }

    this.docVista = vista;
    this.close();
    switchSection("documentos");
  },

  /* ------------------------------------------------------
     VENTANA MODAL CENTRADA Y AVISOS
  ------------------------------------------------------ */
  modal(titulo, contenido, compacto = false) {
    const ventana = document.getElementById("module-dialog");

    ventana.classList.toggle("compact", compacto);
    document.getElementById("module-dialog-title").textContent = titulo;
    document.getElementById("module-dialog-body").innerHTML = contenido;

    if (!ventana.open) {
      ventana.showModal();
    }
  },

  close() {
    const ventana = document.getElementById("module-dialog");

    if (ventana.open) {
      ventana.close();
    }
  },

  aviso(mensaje) {
    const aviso = document.getElementById("module-notice");

    aviso.textContent = mensaje;
    aviso.classList.remove("hidden");

    clearTimeout(this.temporizadorAviso);

    this.temporizadorAviso = setTimeout(() => {
      aviso.classList.add("hidden");
    }, 4000);
  },

  /* ------------------------------------------------------
     CITAS · RENDER GENERAL
  ------------------------------------------------------ */
  render() {
    if (this.pestaña === "calendario") {
      this.calendario();
    } else if (this.pestaña === "agendar") {
      this.agendar();
    } else {
      this.listaCitas();
    }

    this.marcarMenu();
  },

  /* ------------------------------------------------------
     1. CALENDARIO
  ------------------------------------------------------ */
  calendario() {
    const año = this.mes.getFullYear();
    const numeroMes = this.mes.getMonth();
    const primerDia = (this.mes.getDay() + 6) % 7; // semana inicia en lunes
    const cantidadDias = new Date(año, numeroMes + 1, 0).getDate();
    const hoy = this.hoyISO();

    const diasSemana = [
      ["Lunes", "Lun"], ["Martes", "Mar"], ["Miércoles", "Mié"],
      ["Jueves", "Jue"], ["Viernes", "Vie"], ["Sábado", "Sáb"], ["Domingo", "Dom"]
    ];

    let celdas = diasSemana
      .map(([largo, corto]) => `
        <span class="calendar-weekday">
          <span class="wd-full">${largo}</span>
          <span class="wd-short">${corto}</span>
        </span>
      `)
      .join("");

    celdas += '<span class="calendar-empty"></span>'.repeat(primerDia);

    for (let dia = 1; dia <= cantidadDias; dia++) {
      const fecha = this.fechaISO(new Date(año, numeroMes, dia));

      const citasDia = this.citas
        .filter((c) => c.fecha === fecha)
        .sort((a, b) => a.hora.localeCompare(b.hora));

      const primera = citasDia[0];
      const seleccionado = fecha === this.diaSeleccionado;

      const evento = primera
        ? `
          <span class="calendar-event ev-${this.claseEstado(primera.estado)}">
            <span class="calendar-event-name">
              <span class="calendar-dot dot-${this.claseEstado(primera.estado)}"></span>
              ${this.escapar(primera.especialidad)}
            </span>
            <span class="calendar-event-time">${primera.hora}</span>
          </span>
          ${citasDia.length > 1
            ? `<span class="calendar-more">+${citasDia.length - 1} más</span>`
            : ""}
        `
        : "";

      const puntos = citasDia
        .slice(0, 3)
        .map((c) => `<span class="calendar-dot dot-${this.claseEstado(c.estado)}"></span>`)
        .join("");

      celdas += `
        <button
          type="button"
          class="calendar-day ${seleccionado ? "selected" : ""} ${fecha === hoy ? "today" : ""}"
          aria-pressed="${seleccionado}"
          aria-label="${this.fechaTexto(fecha)}, ${citasDia.length} cita(s)"
          onclick="MediModules.selectDay('${fecha}')"
        >
          <span class="calendar-num">${dia}</span>
          ${evento}
          <span class="calendar-dots">${puntos}</span>
        </button>
      `;
    }

    const tituloBase = this.mes.toLocaleDateString("es-PE", {
      month: "long",
      year: "numeric"
    });
    const tituloMes = tituloBase.charAt(0).toUpperCase() + tituloBase.slice(1);

    const citasDelDia = this.citas
      .filter((c) => c.fecha === this.diaSeleccionado)
      .sort((a, b) => a.hora.localeCompare(b.hora));

    const detalleDia = citasDelDia.length > 0
      ? citasDelDia.map((cita) => `
          <div class="day-appointment">
            <div class="card-header">
              <strong>${this.escapar(cita.especialidad)}</strong>
              ${this.insignia(cita.estado)}
            </div>

            ${this.filas([
              ["Médico", cita.medico],
              ["Hora", this.horaTexto(cita.hora)],
              ["Lugar", cita.lugar]
            ])}

            <div class="module-actions">
              <button
                type="button"
                class="btn btn-outline"
                onclick="MediModules.detail(${cita.id})"
              >
                Ver detalle
              </button>
            </div>
          </div>
        `).join("")
      : '<p class="empty-state">No tienes citas para este día.</p>';

    document.getElementById("citas-content").innerHTML = `
      <div class="calendar-toolbar">
        <h2>Calendario de citas</h2>

        <div class="calendar-controls">
          <button type="button" class="btn btn-outline" aria-label="Mes anterior"
            onclick="MediModules.moveMonth(-1)">‹</button>

          <strong class="calendar-title">${tituloMes}</strong>

          <button type="button" class="btn btn-outline" aria-label="Mes siguiente"
            onclick="MediModules.moveMonth(1)">›</button>

          <button type="button" class="btn btn-secondary"
            onclick="MediModules.irHoy()">Hoy</button>
        </div>
      </div>

      <div class="calendar-layout">
        <article class="card">
          <div class="calendar-grid">${celdas}</div>

          <p class="text-muted mt-1">
            <small>
              <span class="calendar-dot dot-proxima"></span> Próxima ·
              <span class="calendar-dot dot-atendida"></span> Atendida ·
              <span class="calendar-dot dot-cancelada"></span> Cancelada
            </small>
          </p>
        </article>

        <article class="card">
          <h3>${this.fechaTexto(this.diaSeleccionado)}</h3>
          <p class="text-muted"><small>${citasDelDia.length} cita(s) en este día</small></p>
          ${detalleDia}
        </article>
      </div>
    `;
  },

  selectDay(fecha) {
    this.diaSeleccionado = fecha;
    this.render();
  },

  moveMonth(cantidad) {
    this.mes = new Date(this.mes.getFullYear(), this.mes.getMonth() + cantidad, 1);
    this.diaSeleccionado = this.fechaISO(this.mes);
    this.render();
  },

  irHoy() {
    const hoy = new Date();

    this.mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.diaSeleccionado = this.fechaISO(hoy);
    this.render();
  },

  /* ------------------------------------------------------
     2 y 6. PRÓXIMAS CITAS E HISTORIAL (cards)
  ------------------------------------------------------ */
  listaCitas() {
    const proximas = this.pestaña === "proximas";

    const lista = this.citas
      .filter((c) => (proximas ? c.estado === "Próxima" : c.estado !== "Próxima"))
      .sort((a, b) => {
        const fa = a.fecha + "T" + a.hora;
        const fb = b.fecha + "T" + b.hora;
        return proximas ? fa.localeCompare(fb) : fb.localeCompare(fa);
      });

    const titulo = proximas
      ? this.tituloVista("Próximas citas", "Tus consultas programadas, de la más cercana a la más lejana.")
      : this.tituloVista("Historial de citas", "Tus citas atendidas y canceladas.");

    document.getElementById("citas-content").innerHTML = `
      ${titulo}
      <div class="module-cards">
        ${lista.length > 0
          ? lista.map((c) => this.tarjetaCita(c, proximas)).join("")
          : '<p class="empty-state">No tienes citas en esta sección.</p>'}
      </div>
    `;
  },

  tarjetaCita(cita, conAcciones) {
    const filas = conAcciones
      ? [
          ["Médico", cita.medico],
          ["Fecha", this.fechaTexto(cita.fecha)],
          ["Hora", this.horaTexto(cita.hora)],
          ["Clínica", cita.lugar],
          ["Dirección", cita.direccion]
        ]
      : [
          ["Médico", cita.medico],
          ["Fecha", this.fechaTexto(cita.fecha)],
          ["Hora", this.horaTexto(cita.hora)],
          ["Lugar", cita.lugar]
        ];

    const acciones = conAcciones
      ? `
        <button type="button" class="btn btn-outline" onclick="MediModules.detail(${cita.id})">Ver detalle</button>
        <button type="button" class="btn btn-secondary" onclick="MediModules.pedirReprogramar(${cita.id})">Reprogramar</button>
        <button type="button" class="btn btn-danger" onclick="MediModules.pedirCancelar(${cita.id})">Cancelar</button>
      `
      : `
        <button type="button" class="btn btn-outline" onclick="MediModules.detail(${cita.id})">Ver detalle</button>
      `;

    return `
      <article class="card">
        <div class="card-header">
          <h3>${this.escapar(cita.especialidad)}</h3>
          ${this.insignia(cita.estado)}
        </div>

        ${this.filas(filas)}

        <div class="module-actions">${acciones}</div>
      </article>
    `;
  },

  /* ------------------------------------------------------
     3. DETALLE DE CITA
  ------------------------------------------------------ */
  detail(id) {
    const cita = this.buscarCita(id);

    if (!cita) return;

    let botones = "";

    if (cita.estado === "Próxima") {
      botones = `
        <button type="button" class="btn btn-primary" onclick="MediModules.pedirReprogramar(${cita.id})">Reprogramar</button>
        <button type="button" class="btn btn-secondary" onclick="MediModules.pedirFinalizar(${cita.id})">Marcar como atendida</button>
        <button type="button" class="btn btn-danger" onclick="MediModules.pedirCancelar(${cita.id})">Cancelar</button>
      `;
    } else if (cita.estado === "Atendida") {
      botones = `
        <button type="button" class="btn btn-primary" onclick="MediModules.documentForm(${cita.id})">Subir documento</button>
      `;
    }

    this.modal("Detalle de cita", `
      <div class="detail-sections">
        <section class="detail-section">
          <h3>Información de la cita</h3>
          ${this.filas([
            ["Especialidad", cita.especialidad],
            ["Médico", cita.medico],
            ["Fecha", this.fechaTexto(cita.fecha)],
            ["Hora", this.horaTexto(cita.hora)],
            ["Estado", this.insignia(cita.estado), true]
          ])}
        </section>

        <section class="detail-section">
          <h3>Lugar</h3>
          ${this.filas([
            ["Clínica / hospital", cita.lugar],
            ["Dirección", cita.direccion]
          ])}
        </section>

        ${cita.motivo ? `
          <section class="detail-section">
            <h3>Motivo de la cita</h3>
            <p>${this.escapar(cita.motivo)}</p>
          </section>
        ` : ""}
      </div>

      <div class="module-actions">
        ${botones}
        <button type="button" class="btn btn-outline" onclick="MediModules.close()">Cerrar</button>
      </div>
    `);
  },

  resumenCompacto(cita) {
    return this.filas([
      ["Especialidad", cita.especialidad],
      ["Médico", cita.medico],
      ["Fecha", this.fechaTexto(cita.fecha)],
      ["Hora", this.horaTexto(cita.hora)]
    ]);
  },

  /* ------------------------------------------------------
     4. CANCELAR CITA
  ------------------------------------------------------ */
  pedirCancelar(id) {
    const cita = this.buscarCita(id);

    if (!cita || cita.estado !== "Próxima") return;

    this.modal("¿Deseas cancelar esta cita?", `
      ${this.resumenCompacto(cita)}

      <div class="module-actions">
        <button type="button" class="btn btn-outline" onclick="MediModules.close()">Volver</button>
        <button type="button" class="btn btn-danger" onclick="MediModules.cancelar(${id})">Cancelar cita</button>
      </div>
    `, true);
  },

  cancelar(id) {
    const cita = this.buscarCita(id);

    if (!cita || cita.estado !== "Próxima") return;

    cita.estado = "Cancelada";
    this.render();

    this.modal("Cita cancelada", `
      <div class="result-box result-danger">
        <i data-icon="circle-xmark"></i>
        <p>La cita fue cancelada.</p>
      </div>

      ${this.filas([
        ["Especialidad", cita.especialidad],
        ["Médico", cita.medico],
        ["Fecha", this.fechaTexto(cita.fecha)],
        ["Hora", this.horaTexto(cita.hora)],
        ["Estado", this.insignia(cita.estado), true]
      ])}

      <div class="module-actions">
        <button type="button" class="btn btn-primary" onclick="MediModules.irCitas('historial')">Ver historial</button>
        <button type="button" class="btn btn-outline" onclick="MediModules.close()">Cerrar</button>
      </div>
    `, true);
  },

  /* ------------------------------------------------------
     5. REPROGRAMAR CITA
  ------------------------------------------------------ */
  pedirReprogramar(id) {
    const cita = this.buscarCita(id);

    if (!cita || cita.estado !== "Próxima") return;

    this.modal("¿Deseas modificar esta cita?", `
      ${this.resumenCompacto(cita)}

      <div class="module-actions">
        <button type="button" class="btn btn-outline" onclick="MediModules.close()">Volver</button>
        <button type="button" class="btn btn-primary" onclick="MediModules.reprogramarForm(${id})">Continuar</button>
      </div>
    `, true);
  },

  reprogramarForm(id) {
    const cita = this.buscarCita(id);

    if (!cita || cita.estado !== "Próxima") return;

    const hoy = this.hoyISO();
    const fechaInicial = cita.fecha >= hoy ? cita.fecha : hoy;

    this.modal("Reprogramar cita", `
      <p class="text-muted">
        ${this.escapar(cita.especialidad)} · ${this.escapar(cita.medico)}<br>
        Fecha actual: ${this.fechaTexto(cita.fecha)} · ${this.horaTexto(cita.hora)}
      </p>

      <form id="reschedule-form" class="module-form mt-1" novalidate>
        <label class="wide">
          Nueva fecha
          <input id="rp-fecha" name="fecha" type="date" min="${hoy}" value="${fechaInicial}" required>
        </label>

        <div class="field wide">
          <span class="field-label">Nueva hora</span>
          <div id="rp-slots">${this.slotsHTML(cita.medico, fechaInicial, cita.id, "")}</div>
        </div>

        <p id="reschedule-error" class="error-msg wide" role="alert"></p>

        <div class="module-actions wide">
          <button type="submit" class="btn btn-primary">Confirmar cambio</button>
          <button type="button" class="btn btn-outline" onclick="MediModules.close()">Volver</button>
        </div>
      </form>
    `);

    const formulario = document.getElementById("reschedule-form");

    formulario.querySelector("#rp-fecha").addEventListener("change", (evento) => {
      document.getElementById("rp-slots").innerHTML =
        this.slotsHTML(cita.medico, evento.target.value, cita.id, "");
    });

    formulario.onsubmit = (evento) => {
      evento.preventDefault();

      const datos = new FormData(formulario);
      const fecha = datos.get("fecha");
      const hora = datos.get("hora");
      const error = document.getElementById("reschedule-error");

      if (!fecha || fecha < this.hoyISO()) {
        error.textContent = "Selecciona una fecha válida.";
        return;
      }

      if (!hora) {
        error.textContent = "Selecciona un horario disponible.";
        return;
      }

      cita.fecha = fecha;
      cita.hora = hora;

      this.diaSeleccionado = fecha;
      this.mes = new Date(
        new Date(fecha + "T12:00:00").getFullYear(),
        new Date(fecha + "T12:00:00").getMonth(),
        1
      );

      this.render();

      this.modal("Cita reprogramada", `
        <div class="result-box result-ok">
          <i data-icon="circle-check"></i>
          <p>¡Cambio realizado correctamente!</p>
        </div>

        ${this.filas([
          ["Especialidad", cita.especialidad],
          ["Médico", cita.medico],
          ["Nueva fecha", this.fechaTexto(cita.fecha)],
          ["Nueva hora", this.horaTexto(cita.hora)],
          ["Lugar", cita.lugar]
        ])}

        <div class="module-actions">
          <button type="button" class="btn btn-primary" onclick="MediModules.irCitas('proximas')">Ver próximas citas</button>
          <button type="button" class="btn btn-outline" onclick="MediModules.close()">Cerrar</button>
        </div>
      `, true);
    };
  },

  /* ------------------------------------------------------
     HORARIOS DISPONIBLES (ficticios)
  ------------------------------------------------------ */
  hash(texto) {
    let h = 0;

    for (const caracter of texto) {
      h = (h * 31 + caracter.charCodeAt(0)) >>> 0;
    }

    return h;
  },

  horariosDisponibles(medico, fecha, ignorarId = null) {
    if (!fecha) return [];

    // Sin atención los domingos
    if (new Date(fecha + "T12:00:00").getDay() === 0) return null;

    const base = [];

    for (let h = 8; h <= 17; h++) {
      if (h === 13) continue; // refrigerio
      base.push(`${String(h).padStart(2, "0")}:00`);
      base.push(`${String(h).padStart(2, "0")}:30`);
    }

    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
    const hoy = this.hoyISO();

    return base.filter((hora) => {
      if (fecha < hoy) return false;
      if (fecha === hoy && hora <= horaActual) return false;

      // Horarios ocupados por otros pacientes
      if (this.hash(medico + fecha + hora) % 4 === 0) return false;

      // Choque con otra cita del paciente
      return !this.citas.some((c) =>
        c.id !== ignorarId &&
        c.estado === "Próxima" &&
        c.fecha === fecha &&
        c.hora === hora
      );
    });
  },

  slotsHTML(medico, fecha, ignorarId, seleccionada) {
    if (!medico || !fecha) {
      return '<p class="file-help">Selecciona médico y fecha para ver los horarios disponibles.</p>';
    }

    const lista = this.horariosDisponibles(medico, fecha, ignorarId);

    if (lista === null) {
      return '<p class="file-help">No hay atención los domingos. Elige otra fecha.</p>';
    }

    if (lista.length === 0) {
      return '<p class="file-help">No hay horarios disponibles para esta fecha.</p>';
    }

    return `
      <div class="choice-grid slots" role="radiogroup" aria-label="Horarios disponibles">
        ${lista.map((hora) => `
          <label class="choice">
            <input type="radio" name="hora" value="${hora}" ${hora === seleccionada ? "checked" : ""}>
            <span>${this.horaTexto(hora)}</span>
          </label>
        `).join("")}
      </div>
    `;
  },

  /* ------------------------------------------------------
     7. AGENDAR CITA (pantalla con formulario)
  ------------------------------------------------------ */
  nuevoBorrador() {
    return { especialidad: "", medico: "", fecha: "", hora: "", lugar: "" };
  },

  agendar() {
    const b = this.borrador;
    const hoy = this.hoyISO();

    const lugares = Object.keys(this.lugares)
      .map((lugar) => `
        <option value="${this.atributo(lugar)}" ${b.lugar === lugar ? "selected" : ""}>
          ${this.escapar(lugar)}
        </option>
      `)
      .join("");

    document.getElementById("citas-content").innerHTML = `
      ${this.tituloVista("Agendar cita", "Completa los datos para reservar una nueva atención.")}

      <article class="card schedule-card">
        <form id="schedule-form" class="module-form" novalidate>
          <div class="field wide">
            <label for="ag-buscar" id="ag-esp-label">Especialidad</label>
            <input id="ag-buscar" type="search" autocomplete="off"
              placeholder="Buscar especialidad (ej. Cardiología)">
            <div id="ag-esp" class="choice-grid" role="radiogroup" aria-labelledby="ag-esp-label"></div>
          </div>

          <div class="field wide">
            <span class="field-label" id="ag-med-label">Médico</span>
            <div id="ag-medicos" class="choice-grid" role="radiogroup" aria-labelledby="ag-med-label"></div>
          </div>

          <label>
            Fecha
            <input id="ag-fecha" name="fecha" type="date" min="${hoy}" value="${b.fecha}" ${b.medico ? "" : "disabled"}>
          </label>

          <p class="file-help field-hint">
            Los horarios dependen del médico y de la fecha elegida.
          </p>

          <div class="field wide">
            <span class="field-label">Hora</span>
            <div id="ag-slots"></div>
          </div>

          <label class="wide">
            Lugar
            <select id="ag-lugar" name="lugar">
              <option value="">Selecciona una clínica u hospital</option>
              ${lugares}
            </select>
          </label>

          <p id="schedule-error" class="error-msg wide" role="alert"></p>

          <div class="module-actions wide">
            <button type="submit" class="btn btn-primary">Revisar resumen</button>
            <button type="button" class="btn btn-outline" id="ag-limpiar">Limpiar</button>
          </div>
        </form>
      </article>
    `;

    this.pintarEspecialidades();
    this.pintarMedicos();
    this.pintarSlotsAgenda();

    const formulario = document.getElementById("schedule-form");

    document.getElementById("ag-buscar").addEventListener("input", () => {
      this.pintarEspecialidades();
    });

    formulario.addEventListener("change", (evento) => {
      const campo = evento.target;

      document.getElementById("schedule-error").textContent = "";

      if (campo.name === "especialidad") {
        b.especialidad = campo.value;
        b.medico = "";
        b.hora = "";
        this.pintarMedicos();
        this.actualizarFechaHora();
      } else if (campo.name === "medico") {
        b.medico = campo.value;
        b.hora = "";
        this.actualizarFechaHora();
      } else if (campo.name === "fecha") {
        b.fecha = campo.value;
        b.hora = "";
        this.pintarSlotsAgenda();
      } else if (campo.name === "hora") {
        b.hora = campo.value;
      } else if (campo.name === "lugar") {
        b.lugar = campo.value;
      }
    });

    document.getElementById("ag-limpiar").onclick = () => {
      this.borrador = this.nuevoBorrador();
      this.agendar();
    };

    formulario.onsubmit = (evento) => {
      evento.preventDefault();

      const faltan = [];

      if (!b.especialidad) faltan.push("especialidad");
      if (!b.medico) faltan.push("médico");
      if (!b.fecha) faltan.push("fecha");
      if (!b.hora) faltan.push("hora");
      if (!b.lugar) faltan.push("lugar");

      const error = document.getElementById("schedule-error");

      if (faltan.length > 0) {
        error.textContent = "Completa: " + faltan.join(", ") + ".";
        return;
      }

      error.textContent = "";
      this.citaPendiente = {
        ...b,
        direccion: this.lugares[b.lugar],
        estado: "Próxima",
        motivo: ""
      };

      this.resumenCita();
    };
  },

  pintarEspecialidades() {
    const b = this.borrador;
    const texto = this.normalizar(document.getElementById("ag-buscar").value.trim());

    const lista = Object.keys(this.medicos).filter((esp) =>
      this.normalizar(esp).includes(texto)
    );

    document.getElementById("ag-esp").innerHTML = lista.length > 0
      ? lista.map((esp) => `
          <label class="choice">
            <input type="radio" name="especialidad" value="${this.atributo(esp)}" ${b.especialidad === esp ? "checked" : ""}>
            <span>${this.escapar(esp)}</span>
          </label>
        `).join("")
      : '<p class="file-help">No se encontraron especialidades.</p>';
  },

  pintarMedicos() {
    const b = this.borrador;
    const contenedor = document.getElementById("ag-medicos");

    if (!b.especialidad) {
      contenedor.innerHTML = '<p class="file-help">Selecciona primero una especialidad.</p>';
      return;
    }

    contenedor.innerHTML = this.medicos[b.especialidad]
      .map((medico) => `
        <label class="choice">
          <input type="radio" name="medico" value="${this.atributo(medico)}" ${b.medico === medico ? "checked" : ""}>
          <span><i data-icon="user-doctor"></i> ${this.escapar(medico)}</span>
        </label>
      `)
      .join("");
  },

  actualizarFechaHora() {
    const b = this.borrador;
    const fecha = document.getElementById("ag-fecha");

    fecha.disabled = !b.medico;

    if (!b.medico) {
      fecha.value = "";
      b.fecha = "";
    }

    this.pintarSlotsAgenda();
  },

  pintarSlotsAgenda() {
    const b = this.borrador;

    document.getElementById("ag-slots").innerHTML =
      this.slotsHTML(b.medico, b.fecha, null, b.hora);
  },

  /* ------------------------------------------------------
     8. RESUMEN ANTES DE CONFIRMAR
  ------------------------------------------------------ */
  resumenCita() {
    const cita = this.citaPendiente;

    if (!cita) return;

    this.modal("Resumen de tu cita", `
      ${this.filas([
        ["Especialidad", cita.especialidad],
        ["Médico", cita.medico],
        ["Fecha", this.fechaCorta(cita.fecha)],
        ["Hora", this.horaTexto(cita.hora)],
        ["Lugar", cita.lugar]
      ])}

      <div class="module-actions">
        <button type="button" class="btn btn-outline" onclick="MediModules.close()">Volver / Modificar</button>
        <button type="button" class="btn btn-primary" onclick="MediModules.confirmarCita()">Confirmar cita</button>
      </div>
    `, true);
  },

  confirmarCita() {
    if (!this.citaPendiente) return;

    const nueva = { ...this.citaPendiente, id: Date.now() };

    this.citas.push(nueva);
    this.citaPendiente = null;
    this.borrador = this.nuevoBorrador();

    const fecha = new Date(nueva.fecha + "T12:00:00");

    this.mes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    this.diaSeleccionado = nueva.fecha;

    this.render();

    this.modal("¡Cita agendada correctamente!", `
      <div class="result-box result-ok">
        <i data-icon="circle-check"></i>
        <p>Tu cita fue registrada.</p>
      </div>

      ${this.filas([
        ["Especialidad", nueva.especialidad],
        ["Médico", nueva.medico],
        ["Fecha", this.fechaTexto(nueva.fecha)],
        ["Hora", this.horaTexto(nueva.hora)],
        ["Lugar", nueva.lugar],
        ["Dirección", nueva.direccion],
        ["Estado", this.insignia(nueva.estado), true]
      ])}

      <div class="module-actions">
        <button type="button" class="btn btn-primary" onclick="MediModules.irCitas('proximas')">Ver próximas citas</button>
        <button type="button" class="btn btn-outline" onclick="MediModules.close()">Agendar otra</button>
      </div>
    `, true);
  },

  /* ------------------------------------------------------
     9. MARCAR CITA COMO ATENDIDA
  ------------------------------------------------------ */
  pedirFinalizar(id) {
    const cita = this.buscarCita(id);

    if (!cita || cita.estado !== "Próxima") return;

    this.modal("¿Deseas marcar esta cita como atendida?", `
      ${this.resumenCompacto(cita)}

      <div class="module-actions">
        <button type="button" class="btn btn-outline" onclick="MediModules.close()">Cancelar</button>
        <button type="button" class="btn btn-primary" onclick="MediModules.finalizar(${id})">Finalizar</button>
      </div>
    `, true);
  },

  finalizar(id) {
    const cita = this.buscarCita(id);

    if (!cita || cita.estado !== "Próxima") return;

    cita.estado = "Atendida";
    this.render();

    this.modal("¿Deseas agregar un documento a esta consulta?", `
      <div class="result-box result-ok">
        <i data-icon="circle-check"></i>
        <p>La cita fue marcada como atendida.</p>
      </div>

      <div class="module-actions">
        <button type="button" class="btn btn-primary" onclick="MediModules.documentForm(${id})">Subir archivo</button>
        <button type="button" class="btn btn-outline" onclick="MediModules.omitirDocumento()">Omitir</button>
      </div>
    `, true);
  },

  omitirDocumento() {
    this.close();
    this.aviso("Cita marcada como atendida. Puedes verla en el historial.");
  },

  /* ------------------------------------------------------
     DOCUMENTOS · UTILIDADES
  ------------------------------------------------------ */
  tipoEtiqueta(tipo) {
    return tipo; // Receta, Examen, Informe, Otro
  },

  extension(nombre) {
    return (nombre.split(".").pop() || "").toLowerCase();
  },

  iconoArchivo(nombre) {
    const ext = this.extension(nombre);

    if (ext === "pdf") return "file-pdf";
    if (["jpg", "jpeg", "png"].includes(ext)) return "file-image";

    return "file-lines";
  },

  resolverDoc(doc) {
    const cita = doc.citaId ? this.buscarCita(doc.citaId) : null;

    return {
      cita,
      especialidad: cita ? cita.especialidad : null,
      medico: cita ? cita.medico : null,
      consulta: cita
        ? `Consulta del ${this.fechaCorta(cita.fecha)}`
        : "Sin consulta relacionada"
    };
  },

  limpiarFiltrosDoc() {
    document.getElementById("doc-search").value = "";
    document.getElementById("doc-type").value = "Todos";
    document.getElementById("doc-from").value = "";
    document.getElementById("doc-to").value = "";
  },

  /* ------------------------------------------------------
     10 a 14. LISTADOS DE DOCUMENTOS (cards en CSS Grid)
  ------------------------------------------------------ */
  documents() {
    const info = this.vistasDoc[this.docVista];
    const tipoFijo = info.tipo;

    document.getElementById("doc-title").textContent = info.titulo;
    document.getElementById("doc-subtitle").textContent = info.subtitulo;
    document.getElementById("doc-type-label").classList.toggle("hidden", Boolean(tipoFijo));
    document.querySelector(".document-filters").classList.toggle("sin-tipo", Boolean(tipoFijo));

    const busqueda = this.normalizar(document.getElementById("doc-search").value.trim());
    const tipo = tipoFijo || document.getElementById("doc-type").value;
    const desde = document.getElementById("doc-from").value;
    const hasta = document.getElementById("doc-to").value;

    const contenido = document.getElementById("documents-content");
    const contador = document.getElementById("doc-count");

    if (desde && hasta && desde > hasta) {
      contador.textContent = "";
      contenido.innerHTML = '<p class="empty-state">La fecha “Desde” debe ser anterior o igual a “Hasta”.</p>';
      this.marcarMenu();
      return;
    }

    const resultados = this.documentos
      .filter((doc) => {
        const r = this.resolverDoc(doc);
        const texto = this.normalizar(
          [doc.nombre, r.especialidad, r.medico, doc.subtipo].filter(Boolean).join(" ")
        );

        return (
          texto.includes(busqueda) &&
          (tipo === "Todos" || doc.tipo === tipo) &&
          (!desde || doc.fecha >= desde) &&
          (!hasta || doc.fecha <= hasta)
        );
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    contador.textContent =
      `${resultados.length} documento` + (resultados.length === 1 ? "" : "s");

    contenido.innerHTML = resultados.length > 0
      ? resultados.map((doc) => this.tarjetaDocumento(doc)).join("")
      : '<p class="empty-state">No hay documentos que coincidan con tu búsqueda.</p>';

    this.marcarMenu();
  },

  filasDocumento(doc) {
    const r = this.resolverDoc(doc);
    const fecha = this.fechaCorta(doc.fecha);
    const especialidad = r.especialidad || "No especificada";
    const medico = r.medico || "No especificado";

    switch (this.docVista) {
      case "Recetas":
      case "Informes":
        return [
          ["Médico", medico],
          ["Especialidad", especialidad],
          ["Fecha", fecha],
          ["Consulta relacionada", r.consulta]
        ];

      case "Exámenes":
        return [
          ["Tipo de examen", doc.subtipo || "Resultado de examen"],
          ["Fecha", fecha],
          ["Especialidad", especialidad],
          ["Consulta relacionada", r.consulta]
        ];

      case "Otros":
        return [
          ["Tipo", doc.subtipo || "Otro"],
          ["Fecha", fecha],
          r.especialidad ? ["Especialidad", r.especialidad] : null,
          r.cita ? ["Consulta relacionada", r.consulta] : null
        ];

      default:
        return [
          ["Tipo", doc.tipo],
          ["Fecha", fecha],
          ["Especialidad", especialidad],
          ["Consulta relacionada", r.consulta]
        ];
    }
  },

  tarjetaDocumento(doc) {
    return `
      <article class="card doc-card">
        <div class="doc-card-top">
          <span class="document-icon" aria-hidden="true">
            <i data-icon="${this.iconoArchivo(doc.nombre)}"></i>
            <small>${this.escapar(this.extension(doc.nombre).toUpperCase())}</small>
          </span>

          <h3 class="doc-name">${this.escapar(doc.nombre)}</h3>
        </div>

        ${this.filas(this.filasDocumento(doc))}

        <div class="module-actions">
          <button type="button" class="btn btn-outline" onclick="MediModules.verDocumento(${doc.id})">Ver</button>
          <button type="button" class="btn btn-secondary" onclick="MediModules.descargarDocumento(${doc.id})">Descargar</button>
          <button type="button" class="btn btn-danger" onclick="MediModules.pedirEliminar(${doc.id})">Eliminar</button>
        </div>
      </article>
    `;
  },

  buscarDoc(id) {
    return this.documentos.find((d) => d.id === id);
  },

  verDocumento(id) {
    const doc = this.buscarDoc(id);

    if (!doc) return;

    const r = this.resolverDoc(doc);
    const ext = this.extension(doc.nombre);
    const esImagen = ["jpg", "jpeg", "png"].includes(ext);

    let vista;

    if (doc.url && esImagen) {
      vista = `<img class="doc-preview-img" src="${doc.url}" alt="Vista previa de ${this.atributo(doc.nombre)}">`;
    } else {
      vista = `
        <div class="doc-preview">
          <i data-icon="${this.iconoArchivo(doc.nombre)}"></i>
          <p>${doc.url ? "Vista previa no disponible. Usa “Abrir archivo”." : "Documento de ejemplo (sin archivo adjunto)."}</p>
        </div>
      `;
    }

    this.modal("Detalle del documento", `
      ${vista}

      ${this.filas([
        ["Nombre", doc.nombre],
        ["Tipo", doc.subtipo ? `${doc.tipo} · ${doc.subtipo}` : doc.tipo],
        ["Fecha", this.fechaCorta(doc.fecha)],
        ["Especialidad", r.especialidad || "No especificada"],
        ["Médico", r.medico || "No especificado"],
        ["Consulta relacionada", r.consulta]
      ])}

      <div class="module-actions">
        ${doc.url ? `<a class="btn btn-primary" href="${doc.url}" target="_blank" rel="noopener">Abrir archivo</a>` : ""}
        <button type="button" class="btn btn-secondary" onclick="MediModules.descargarDocumento(${doc.id})">Descargar</button>
        <button type="button" class="btn btn-outline" onclick="MediModules.close()">Cerrar</button>
      </div>
    `);
  },

  descargarDocumento(id) {
    const doc = this.buscarDoc(id);

    if (!doc) return;

    if (!doc.archivo) {
      this.aviso("Descarga simulada: " + doc.nombre + " (documento de ejemplo).");
      return;
    }

    const enlace = document.createElement("a");

    enlace.href = doc.url;
    enlace.download = doc.archivo.name;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  },

  pedirEliminar(id) {
    const doc = this.buscarDoc(id);

    if (!doc) return;

    this.modal("¿Deseas eliminar este documento?", `
      ${this.filas([
        ["Nombre", doc.nombre],
        ["Tipo", doc.tipo],
        ["Fecha", this.fechaCorta(doc.fecha)]
      ])}

      <div class="module-actions">
        <button type="button" class="btn btn-outline" onclick="MediModules.close()">Volver</button>
        <button type="button" class="btn btn-danger" onclick="MediModules.eliminarDocumento(${id})">Eliminar</button>
      </div>
    `, true);
  },

  eliminarDocumento(id) {
    const doc = this.buscarDoc(id);

    if (!doc) return;

    if (doc.url) URL.revokeObjectURL(doc.url);

    this.documentos = this.documentos.filter((d) => d.id !== id);

    this.close();
    this.documents();
    this.aviso("Documento eliminado.");
  },

  /* ------------------------------------------------------
     15. SUBIR DOCUMENTO
  ------------------------------------------------------ */
  documentForm(citaId = null) {
    const hoy = this.hoyISO();
    const citaInicial = citaId ? this.buscarCita(citaId) : null;
    const fechaInicial = citaInicial && citaInicial.fecha < hoy ? citaInicial.fecha : hoy;
    const tipoInicial = this.vistasDoc[this.docVista].tipo || "Receta";

    const consultas = this.citas
      .filter((c) => c.estado === "Atendida")
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((c) => `
        <option value="${c.id}" ${c.id === citaId ? "selected" : ""}>
          ${this.escapar(c.especialidad)} · ${this.fechaCorta(c.fecha)}
        </option>
      `)
      .join("");

    const tipos = ["Receta", "Examen", "Informe", "Otro"]
      .map((t) => `<option ${t === tipoInicial ? "selected" : ""}>${t}</option>`)
      .join("");

    this.modal("Subir documento", `
      <form id="document-form" class="module-form" novalidate>
        <label class="wide">
          Seleccionar archivo
          <input name="archivo" type="file" accept=".pdf,.jpg,.jpeg,.png" required>
          <span class="file-help">PDF, JPG o PNG · Máximo 10 MB. El archivo estará disponible hasta recargar la página.</span>
        </label>

        <label>
          Tipo de documento
          <select name="tipo" required>${tipos}</select>
        </label>

        <label>
          Fecha del documento
          <input name="fecha" type="date" value="${fechaInicial}" max="${hoy}" required>
        </label>

        <label class="wide">
          Consulta relacionada
          <select name="citaId">
            <option value="">Sin consulta relacionada</option>
            ${consultas}
          </select>
        </label>

        <p id="document-error" class="error-msg wide" role="alert"></p>

        <div class="module-actions wide">
          <button type="submit" class="btn btn-primary">Subir archivo</button>
          <button type="button" class="btn btn-outline" onclick="MediModules.close()">Cancelar</button>
        </div>
      </form>
    `);

    document.getElementById("document-form").onsubmit = (evento) => {
      evento.preventDefault();

      const datos = new FormData(evento.target);
      const archivo = datos.get("archivo");
      const fecha = datos.get("fecha");
      const tipo = datos.get("tipo");
      const error = document.getElementById("document-error");

      const permitidos = ["application/pdf", "image/jpeg", "image/png"];

      if (!archivo || !archivo.name) {
        error.textContent = "Selecciona un archivo.";
        return;
      }

      if (!permitidos.includes(archivo.type)) {
        error.textContent = "El archivo debe ser PDF, JPG o PNG.";
        return;
      }

      if (archivo.size === 0 || archivo.size > 10 * 1024 * 1024) {
        error.textContent = "El archivo debe tener contenido y pesar como máximo 10 MB.";
        return;
      }

      if (!fecha || fecha > this.hoyISO()) {
        error.textContent = "La fecha del documento no puede estar en el futuro.";
        return;
      }

      const esImagen = archivo.type.startsWith("image/");
      const subtipos = {
        Examen: esImagen ? "Imágenes médicas" : "Resultado de examen",
        Otro: "Documento"
      };

      const nuevo = {
        id: Date.now(),
        nombre: archivo.name,
        tipo,
        subtipo: subtipos[tipo],
        fecha,
        citaId: Number(datos.get("citaId")) || null,
        archivo,
        url: URL.createObjectURL(archivo)
      };

      this.documentos.push(nuevo);

      this.modal("Documento agregado correctamente.", `
        <div class="result-box result-ok">
          <i data-icon="circle-check"></i>
          <p>Tu documento ya está en tu biblioteca.</p>
        </div>

        ${this.filas([
          ["Archivo", nuevo.nombre],
          ["Tipo", nuevo.tipo],
          ["Fecha", this.fechaCorta(nuevo.fecha)],
          ["Consulta relacionada", this.resolverDoc(nuevo).consulta]
        ])}

        <div class="module-actions">
          <button type="button" class="btn btn-primary" onclick="MediModules.irDocumentos('Todos')">Ir a Todos los documentos</button>
          <button type="button" class="btn btn-outline" onclick="MediModules.close()">Cerrar</button>
        </div>
      `, true);

      // Actualizar la lista si el paciente ya está viendo documentos
      if (!document.getElementById("view-documentos").classList.contains("hidden")) {
        this.limpiarFiltrosDoc();
        this.documents();
      }
    };
  }
};

// Preparar fechas de ejemplo
MediModules.iniciar();

// Menús desplegables: teclado y clic fuera
document.querySelectorAll(".nav-trigger").forEach(function (disparador) {
  disparador.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      MediModules.toggleMenu(evento, disparador);
    }

    if (evento.key === "Escape") {
      MediModules.cerrarMenus();
    }
  });
});

document.querySelectorAll(".nav-dropdown").forEach(function (menu) {
  menu.addEventListener("mouseleave", function () {
    menu.classList.remove("cerrado");
  });
});

document.addEventListener("click", function () {
  MediModules.cerrarMenus();
});

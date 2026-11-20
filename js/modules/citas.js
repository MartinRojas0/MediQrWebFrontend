// ==========================================================
// MediQR · Vista Citas
//
// Calendario, listado, agendado, reprogramacion y cancelacion.
//
// Se registra en MediPartes y luego js/data/store.js lo recombina en un
// unico objeto con Object.assign, de modo que 'this.' sigue resolviendo
// igual que antes. Sin empaquetador: el proyecto carga scripts clasicos,
// asi que no se usan 'import' ni 'export' nativos.
// ==========================================================
window.MediPartes = window.MediPartes || {};

function sesionServidorCitas() {
  return Boolean(window.MediApi && window.MediApi.storage &&
    window.MediApi.storage.getToken() &&
    !(window.AccesoModulo && window.AccesoModulo.sesion &&
      window.AccesoModulo.sesion.esDemo));
}

window.MediPartes.citas = {
  profesionalesServidor: [],
  profesionalesServidorToken: null,
  profesionalesServidorCargados: false,
  profesionalesServidorCargando: false,
  citaServidorGuardando: false,

  render() {
    const contenido = document.getElementById("citas-content");
    if (sesionServidorCitas()) {
      const token = window.MediApi.storage.getToken();
      if (token !== this.citasServidorToken) {
        this.citasServidorToken = token;
        this.citasServidorCargadas = false;
        this.citasServidorCargando = false;
        this.citas = [];
        this.profesionalesServidorToken = null;
        this.profesionalesServidorCargados = false;
        this.profesionalesServidorCargando = false;
        this.profesionalesServidor = [];
      }
      if (!this.citasServidorCargadas) {
        if (!this.citasServidorCargando) this.cargarCitasServidor(token);
        return;
      }
      this.renderServidor();
      return;
    }

    if (this.pestaña === "calendario") {
      this.calendario();
    } else if (this.pestaña === "agendar") {
      this.agendar();
    } else {
      this.listaCitas();
    }

    this.marcarMenu();
  },

  renderServidor() {
    if (this.pestaña === "agendar") {
      this.agendarServidor();
    } else if (this.pestaña === "calendario") {
      this.calendario();
    } else {
      this.listaCitas();
    }
    this.marcarMenu();
  },

  async cargarCitasServidor(token) {
    const contenido = document.getElementById("citas-content");
    this.citasServidorCargando = true;
    if (contenido) contenido.innerHTML = '<p class="text-muted" role="status">Cargando tus citas...</p>';
    try {
      const citas = await window.MediApi.citas.listMine();
      if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
      this.citas = citas.map((cita) => this.citaDesdeServidor(cita));
      this.citasServidorCargadas = true;
      this.renderServidor();
    } catch (error) {
      if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
      if (contenido) {
        contenido.innerHTML = `
          <h1 class="heading-1" data-titulo-vista>Citas</h1>
          <p class="error-msg" role="alert">${this.escapar(
            error.message || "No se pudieron cargar tus citas."
          )}</p>
          <button type="button" class="btn btn-outline" data-action="citas:hoy">Reintentar</button>`;
      }
    } finally {
      if (token === this.citasServidorToken) this.citasServidorCargando = false;
    }
  },

  citaDesdeServidor(cita) {
    const fechaHora = new Date(cita.fechaHora);
    if (!Number.isFinite(fechaHora.getTime())) {
      throw new Error("El servidor devolvió una fecha de cita inválida.");
    }
    const estados = {
      PENDIENTE: "Pendiente",
      CONFIRMADA: "Confirmada",
      ATENDIDA: "Atendida",
      CANCELADA: "Cancelada"
    };
    if (!estados[cita.estado]) {
      throw new Error("El servidor devolvió un estado de cita desconocido.");
    }
    const hora = `${String(fechaHora.getHours()).padStart(2, "0")}:` +
      `${String(fechaHora.getMinutes()).padStart(2, "0")}`;
    const activa = ["PENDIENTE", "CONFIRMADA"].includes(cita.estado) &&
      fechaHora.getTime() > Date.now();
    return {
      id: cita.id,
      personalId: cita.personalId,
      profesional: cita.profesional || "Profesional no disponible",
      medico: cita.profesional || "Profesional no disponible",
      especialidad: cita.especialidad || "Especialidad no indicada",
      fecha: this.fechaISO(fechaHora),
      hora,
      fechaHoraISO: cita.fechaHora,
      estado: activa ? "Próxima" : estados[cita.estado],
      estadoEtiqueta: estados[cita.estado],
      activa,
      estadoApi: cita.estado,
      motivo: cita.motivo || ""
    };
  },

  citaEsProxima(cita) {
    if (!sesionServidorCitas()) return cita.estado === "Próxima";
    return ["PENDIENTE", "CONFIRMADA"].includes(cita.estadoApi) &&
      new Date(cita.fechaHoraISO).getTime() > Date.now();
  },

  estadoTextoCita(cita) {
    return sesionServidorCitas() ? (cita.estadoEtiqueta || cita.estado) : cita.estado;
  },

  async recargarCitasServidor() {
    const token = window.MediApi.storage.getToken();
    const citas = await window.MediApi.citas.listMine();
    if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return false;
    this.citas = citas.map((cita) => this.citaDesdeServidor(cita));
    this.citasServidorToken = token;
    this.citasServidorCargadas = true;
    return true;
  },

  fechaHoraLocal(valor) {
    const fecha = new Date(valor);
    if (!Number.isFinite(fecha.getTime())) return "";
    const dos = (numero) => String(numero).padStart(2, "0");
    return `${this.fechaISO(fecha)}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
  },

  fechaHoraMinima() {
    return this.fechaHoraLocal(Date.now() + 60 * 1000);
  },

  async agendarServidor() {
    const contenido = document.getElementById("citas-content");
    const token = window.MediApi.storage.getToken();
    if (this.profesionalesServidorToken !== token) {
      this.profesionalesServidorToken = token;
      this.profesionalesServidorCargados = false;
      this.profesionalesServidor = [];
    }

    if (!this.profesionalesServidorCargados) {
      if (this.profesionalesServidorCargando) return;
      this.profesionalesServidorCargando = true;
      if (contenido) contenido.innerHTML = '<p class="text-muted" role="status">Cargando profesionales...</p>';
      try {
        const personal = await window.MediApi.citas.listProfessionalsMine();
        if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
        this.profesionalesServidor = personal;
        this.profesionalesServidorCargados = true;
      } catch (error) {
        if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
        if (contenido) {
          contenido.innerHTML = `
            ${this.tituloVista("Agendar cita", "No se pudieron cargar los profesionales disponibles.")}
            <p class="error-msg" role="alert">${this.escapar(error.message || "Inténtalo nuevamente.")}</p>
            <button type="button" class="btn btn-outline" data-action="citas:hoy">Reintentar</button>`;
        }
        return;
      } finally {
        if (token === this.profesionalesServidorToken) this.profesionalesServidorCargando = false;
      }
    }

    if (!contenido) return;
    if (this.profesionalesServidor.length === 0) {
      contenido.innerHTML = `
        ${this.tituloVista("Agendar cita", "No hay profesionales disponibles para reservar en este momento.")}
        <p class="empty-state">Vuelve a intentarlo más tarde o contacta con el centro de salud.</p>`;
      return;
    }

    const opciones = this.profesionalesServidor.map((personal) => `
      <option value="${this.atributo(personal.id)}">
        ${this.escapar(personal.especialidad)} · ${this.escapar(personal.nombre)}
      </option>
    `).join("");
    contenido.innerHTML = `
      ${this.tituloVista("Agendar cita", "Elige un profesional y un horario que no tenga otra cita reservada.")}
      <article class="card schedule-card">
        <form id="schedule-server-form" class="module-form" novalidate>
          <label class="wide" for="cita-personal">Profesional y especialidad
            <select id="cita-personal" name="personalId" required>
              <option value="">Selecciona un profesional</option>
              ${opciones}
            </select>
          </label>
          <label class="wide" for="cita-fecha-hora">Fecha y hora
            <input id="cita-fecha-hora" name="fechaHora" type="datetime-local"
              min="${this.fechaHoraMinima()}" required>
          </label>
          <label class="wide" for="cita-motivo">Motivo (opcional)
            <textarea id="cita-motivo" name="motivo" maxlength="255" rows="3"></textarea>
          </label>
          <p class="file-help wide">
            La disponibilidad confirma que el horario no está ocupado en MediQR.
            El sistema no registra sedes ni horarios laborales del centro; confirma la ubicación antes de asistir.
          </p>
          <p id="schedule-server-error" class="error-msg wide" role="alert"></p>
          <div class="module-actions wide">
            <button type="submit" class="btn btn-primary">Revisar disponibilidad</button>
            <button type="button" class="btn btn-outline" data-action="citas:ir" data-vista="proximas">Volver a mis citas</button>
          </div>
        </form>
      </article>`;

    const formulario = document.getElementById("schedule-server-form");
    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const datos = new FormData(formulario);
      const personalId = Number(datos.get("personalId"));
      const fechaValor = datos.get("fechaHora");
      const fechaHora = new Date(fechaValor);
      const error = document.getElementById("schedule-server-error");
      if (!personalId || !Number.isFinite(fechaHora.getTime()) || fechaHora <= new Date()) {
        error.textContent = "Selecciona un profesional y una fecha futura.";
        return;
      }
      const fechaHoraISO = fechaHora.toISOString();
      const boton = formulario.querySelector('[type="submit"]');
      boton.disabled = true;
      error.textContent = "";
      const sessionToken = window.MediApi.storage.getToken();
      try {
        const disponibilidad = await window.MediApi.citas.availabilityMine(personalId, fechaHoraISO);
        if (!sesionServidorCitas() || sessionToken !== window.MediApi.storage.getToken()) return;
        if (!disponibilidad || disponibilidad.disponible !== true) {
          error.textContent = "Ese horario ya no está disponible. Elige otra fecha u hora.";
          return;
        }
        const personal = this.profesionalesServidor.find((item) => item.id === personalId);
        this.citaPendiente = {
          personalId,
          profesional: personal ? personal.nombre : "",
          medico: personal ? personal.nombre : "",
          especialidad: personal ? personal.especialidad : "",
          fecha: this.fechaISO(fechaHora),
          hora: `${String(fechaHora.getHours()).padStart(2, "0")}:` +
            `${String(fechaHora.getMinutes()).padStart(2, "0")}`,
          fechaHoraISO,
          motivo: String(datos.get("motivo") || "").trim(),
          estado: "Próxima",
          estadoApi: "PENDIENTE"
        };
        this.resumenCita();
      } catch (requestError) {
        error.textContent = requestError.message || "No se pudo verificar la disponibilidad.";
      } finally {
        if (boton.isConnected) boton.disabled = false;
      }
    });
  },

  async detailServidor(id) {
    const token = window.MediApi.storage.getToken();
    this.modal("Detalle de cita", '<p class="text-muted" role="status">Cargando la cita...</p>');
    try {
      const response = await window.MediApi.citas.getMine(id);
      if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
      const cita = this.citaDesdeServidor(response);
      const botones = `
        ${cita.estadoApi === "PENDIENTE" && this.citaEsProxima(cita)
          ? `<button type="button" class="btn btn-primary" data-action="citas:pedir-reprogramar" data-id="${cita.id}">Reprogramar</button>`
          : ""}
        ${this.citaEsProxima(cita)
          ? `<button type="button" class="btn btn-danger" data-action="citas:pedir-cancelar" data-id="${cita.id}">Cancelar</button>`
          : ""}
      `;
      this.modal("Detalle de cita", `
        <div class="detail-sections">
          <section class="detail-section">
            <h3>Información de la cita</h3>
            ${this.filas([
              ["Especialidad", cita.especialidad],
              ["Profesional", cita.profesional],
              ["Fecha", this.fechaCorta(cita.fecha)],
              ["Hora", this.horaTexto(cita.hora)],
              ["Estado", this.insignia(this.estadoTextoCita(cita)), true]
            ])}
          </section>
          ${cita.motivo ? `
            <section class="detail-section">
              <h3>Motivo</h3>
              <p>${this.escapar(cita.motivo)}</p>
            </section>` : ""}
          <p class="file-help">
            La sede no está registrada en MediQR. Confirma la ubicación con el centro de salud.
          </p>
        </div>
        <div class="module-actions">
          ${botones}
          <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cerrar</button>
        </div>`);
    } catch (error) {
      if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
      this.modal("No se pudo cargar la cita", `
        <p class="error-msg" role="alert">${this.escapar(error.message || "La cita no está disponible.")}</p>
        <div class="module-actions">
          <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cerrar</button>
        </div>`);
    }
  },

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
           data-action="citas:seleccionar-dia" data-fecha="${fecha}"
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
              ${this.insignia(this.estadoTextoCita(cita))}
            </div>

            ${this.filas([
              ["Médico", cita.medico],
              ["Hora", this.horaTexto(cita.hora)],
              cita.lugar ? ["Lugar", cita.lugar] : null
            ])}

            <div class="module-actions">
              <button
                type="button"
                class="btn btn-outline"
                 data-action="citas:detalle" data-id="${cita.id}"
              >
                Ver detalle
              </button>
            </div>
          </div>
        `).join("")
      : '<p class="empty-state">No tienes citas para este día.</p>';

    document.getElementById("citas-content").innerHTML = `
<div class="calendar-toolbar">
      <h1 class="heading-1" data-titulo-vista>Calendario de citas</h1>

        <div class="calendar-controls">
          <button type="button" class="btn btn-outline" aria-label="Mes anterior"
             data-action="citas:mes" data-paso="-1">‹</button>

          <strong class="calendar-title">${tituloMes}</strong>

          <button type="button" class="btn btn-outline" aria-label="Mes siguiente"
             data-action="citas:mes" data-paso="1">›</button>

          <button type="button" class="btn btn-secondary"
             data-action="citas:hoy">Hoy</button>
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

  listaCitas() {
    const proximas = this.pestaña === "proximas";

    const lista = this.citas
      .filter((c) => (proximas ? this.citaEsProxima(c) : !this.citaEsProxima(c)))
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
          ["Fecha", this.fechaCorta(cita.fecha)],
          ["Hora", this.horaTexto(cita.hora)],
          cita.lugar ? ["Clínica", cita.lugar] : null,
          cita.direccion ? ["Dirección", cita.direccion] : null
        ]
      : [
          ["Médico", cita.medico],
          ["Fecha", this.fechaCorta(cita.fecha)],
          ["Hora", this.horaTexto(cita.hora)],
          cita.lugar ? ["Lugar", cita.lugar] : null
        ];

    const puedeReprogramar = !sesionServidorCitas() ||
      (cita.estadoApi === "PENDIENTE" && this.citaEsProxima(cita));
    const puedeCancelar = !sesionServidorCitas() || this.citaEsProxima(cita);
    const acciones = conAcciones
      ? `
        <button type="button" class="btn btn-outline"  data-action="citas:detalle" data-id="${cita.id}">Ver detalle</button>
        ${puedeReprogramar
          ? `<button type="button" class="btn btn-secondary" data-action="citas:pedir-reprogramar" data-id="${cita.id}">Reprogramar</button>`
          : ""}
        ${puedeCancelar
          ? `<button type="button" class="btn btn-danger" data-action="citas:pedir-cancelar" data-id="${cita.id}">Cancelar</button>`
          : ""}
      `
      : `
        <button type="button" class="btn btn-outline"  data-action="citas:detalle" data-id="${cita.id}">Ver detalle</button>
      `;

    return `
      <article class="card">
        <div class="card-header">
          <h3>${this.escapar(cita.especialidad)}</h3>
          ${this.insignia(this.estadoTextoCita(cita))}
        </div>

        ${this.filas(filas)}

        <div class="module-actions">${acciones}</div>
      </article>
    `;
  },

  detail(id) {
    if (sesionServidorCitas()) {
      this.detailServidor(id);
      return;
    }
    const cita = this.buscarCita(id);

    if (!cita) return;

    let botones = "";

    if (cita.estado === "Próxima") {
      botones = `
        <button type="button" class="btn btn-primary"  data-action="citas:pedir-reprogramar" data-id="${cita.id}">Reprogramar</button>
        <button type="button" class="btn btn-secondary"  data-action="citas:pedir-finalizar" data-id="${cita.id}">Marcar como atendida</button>
        <button type="button" class="btn btn-danger"  data-action="citas:pedir-cancelar" data-id="${cita.id}">Cancelar</button>
      `;
    } else if (cita.estado === "Atendida") {
      botones = `
        <button type="button" class="btn btn-primary"  data-action="documentos:form" data-id="${cita.id}">Subir documento</button>
      `;
    }

    this.modal("Detalle de cita", `
      <div class="detail-sections">
        <section class="detail-section">
          <h3>Información de la cita</h3>
          ${this.filas([
            ["Especialidad", cita.especialidad],
            ["Médico", cita.medico],
            ["Fecha", this.fechaCorta(cita.fecha)],
            ["Hora", this.horaTexto(cita.hora)],
            ["Estado", this.insignia(this.estadoTextoCita(cita)), true]
          ])}
        </section>

        ${cita.lugar || cita.direccion ? `
          <section class="detail-section">
            <h3>Lugar</h3>
            ${this.filas([
              cita.lugar ? ["Clínica / hospital", cita.lugar] : null,
              cita.direccion ? ["Dirección", cita.direccion] : null
            ])}
          </section>
        ` : ""}

        ${cita.motivo ? `
          <section class="detail-section">
            <h3>Motivo de la cita</h3>
            <p>${this.escapar(cita.motivo)}</p>
          </section>
        ` : ""}
      </div>

      <div class="module-actions">
        ${botones}
        <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cerrar</button>
      </div>
    `);
  },

  resumenCompacto(cita) {
    return this.filas([
      ["Especialidad", cita.especialidad],
      ["Médico", cita.medico],
      ["Fecha", this.fechaCorta(cita.fecha)],
      ["Hora", this.horaTexto(cita.hora)]
    ]);
  },

  pedirCancelar(id) {
    const cita = this.buscarCita(id);

    if (!cita || !this.citaEsProxima(cita)) return;
    if (sesionServidorCitas() &&
        !["PENDIENTE", "CONFIRMADA"].includes(cita.estadoApi)) return;

    this.modal("¿Deseas cancelar esta cita?", `
      ${this.resumenCompacto(cita)}

      <div class="module-actions">
        <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Volver</button>
        <button type="button" class="btn btn-danger"  data-action="citas:cancelar" data-id="${id}">Cancelar cita</button>
      </div>
    `, true);
  },

  async cancelar(id) {
    const cita = this.buscarCita(id);

    if (!cita || !this.citaEsProxima(cita)) return;

    if (sesionServidorCitas()) {
      if (this.citaServidorGuardando) return;
      this.citaServidorGuardando = true;
      const token = window.MediApi.storage.getToken();
      try {
        await window.MediApi.citas.cancelMine(id);
        if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
        cita.estado = "Cancelada";
        cita.estadoEtiqueta = "Cancelada";
        cita.estadoApi = "CANCELADA";
        cita.activa = false;
        this.citasServidorCargadas = true;
        this.render();
        this.modal("Cita cancelada", `
          <div class="result-box result-ok">
            <i data-icon="circle-check"></i>
            <p>La cita se canceló y el cambio quedó guardado.</p>
          </div>
          ${this.filas([
            ["Especialidad", cita.especialidad],
            ["Profesional", cita.profesional],
            ["Fecha", this.fechaCorta(cita.fecha)],
            ["Hora", this.horaTexto(cita.hora)],
            ["Estado", this.insignia("Cancelada"), true]
          ])}
          <div class="module-actions">
            <button type="button" class="btn btn-primary" data-action="citas:ir" data-vista="historial">Ver historial</button>
            <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cerrar</button>
          </div>`);
      } catch (error) {
        if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
        this.modal("No se pudo cancelar la cita", `
          <p class="error-msg" role="alert">${this.escapar(error.message || "Inténtalo nuevamente.")}</p>
          <div class="module-actions">
            <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cerrar</button>
          </div>`);
      } finally {
        this.citaServidorGuardando = false;
      }
      return;
    }

    cita.estado = "Cancelada";
    this.render();

    this.modal("Cita cancelada en este dispositivo", `
      <div class="result-box result-danger">
        <i data-icon="circle-xmark"></i>
        <p>La cita se quitó de tu dispositivo.</p>
      </div>
      <p class="file-help">
        La cita no se ha cancelado en ningún centro: sigue sin conexión a un
        servidor. Si necesitas anularla de verdad, llámate al centro.
      </p>

      ${this.filas([
        ["Especialidad", cita.especialidad],
        ["Médico", cita.medico],
        ["Fecha", this.fechaCorta(cita.fecha)],
        ["Hora", this.horaTexto(cita.hora)],
        ["Estado", this.insignia(cita.estado), true]
      ])}

      <div class="module-actions">
        <button type="button" class="btn btn-primary"  data-action="citas:ir" data-vista="historial">Ver historial</button>
        <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cerrar</button>
      </div>
    `, true);
  },

  pedirReprogramar(id) {
    const cita = this.buscarCita(id);

    if (!cita || !this.citaEsProxima(cita)) return;
    if (sesionServidorCitas() && cita.estadoApi !== "PENDIENTE") return;

    this.modal("¿Deseas modificar esta cita?", `
      ${this.resumenCompacto(cita)}

      <div class="module-actions">
        <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Volver</button>
        <button type="button" class="btn btn-primary"  data-action="citas:reprogramar-form" data-id="${id}">Continuar</button>
      </div>
    `, true);
  },

  reprogramarForm(id) {
    const cita = this.buscarCita(id);

    if (!cita || !this.citaEsProxima(cita)) return;
    if (sesionServidorCitas()) {
      this.reprogramarFormularioServidor(cita);
      return;
    }

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
          <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Volver</button>
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
          ["Nueva fecha", this.fechaCorta(cita.fecha)],
          ["Nueva hora", this.horaTexto(cita.hora)],
          ["Lugar", cita.lugar]
        ])}

        <div class="module-actions">
          <button type="button" class="btn btn-primary"  data-action="citas:ir" data-vista="proximas">Ver próximas citas</button>
          <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cerrar</button>
        </div>
      `, true);
    };
  },

  reprogramarFormularioServidor(cita) {
    this.modal("Reprogramar cita", `
      <p class="text-muted">${this.escapar(cita.especialidad)} · ${this.escapar(cita.profesional)}</p>
      <form id="reschedule-server-form" class="module-form mt-1" novalidate>
        <label class="wide" for="rp-fecha-hora">Nueva fecha y hora
          <input id="rp-fecha-hora" name="fechaHora" type="datetime-local"
            min="${this.fechaHoraMinima()}" value="${this.atributo(this.fechaHoraLocal(cita.fechaHoraISO))}" required>
        </label>
        <p id="reschedule-server-error" class="error-msg wide" role="alert"></p>
        <div class="module-actions wide">
          <button type="submit" class="btn btn-primary">Confirmar cambio</button>
          <button type="button" class="btn btn-outline" data-action="modal:cerrar">Volver</button>
        </div>
      </form>`);

    const formulario = document.getElementById("reschedule-server-form");
    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const datos = new FormData(formulario);
      const fechaHora = new Date(datos.get("fechaHora"));
      const error = document.getElementById("reschedule-server-error");
      if (!Number.isFinite(fechaHora.getTime()) || fechaHora <= new Date()) {
        error.textContent = "Selecciona una fecha y hora futuras.";
        return;
      }
      const fechaHoraISO = fechaHora.toISOString();
      const boton = formulario.querySelector('[type="submit"]');
      if (this.citaServidorGuardando) return;
      this.citaServidorGuardando = true;
      const token = window.MediApi.storage.getToken();
      boton.disabled = true;
      try {
        const disponibilidad = await window.MediApi.citas.availabilityMine(
          cita.personalId,
          fechaHoraISO
        );
        if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
        if (!disponibilidad || disponibilidad.disponible !== true) {
          error.textContent = "Ese horario ya no está disponible. Elige otra fecha u hora.";
          return;
        }
        const respuesta = await window.MediApi.citas.rescheduleMine(cita.id, fechaHoraISO);
        if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
        const actualizada = this.citaDesdeServidor(respuesta);
        this.citas = this.citas.map((item) => item.id === actualizada.id ? actualizada : item);
        this.citasServidorCargadas = true;
        this.render();
        this.modal("Cita reprogramada", `
          <div class="result-box result-ok">
            <i data-icon="circle-check"></i>
            <p>El cambio quedó guardado correctamente.</p>
          </div>
          ${this.filas([
            ["Especialidad", actualizada.especialidad],
            ["Profesional", actualizada.profesional],
            ["Nueva fecha", this.fechaCorta(actualizada.fecha)],
            ["Nueva hora", this.horaTexto(actualizada.hora)]
          ])}
          <p class="file-help">Confirma la sede con el centro de salud.</p>
          <div class="module-actions">
            <button type="button" class="btn btn-primary" data-action="citas:ir" data-vista="proximas">Ver próximas citas</button>
            <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cerrar</button>
          </div>`);
      } catch (requestError) {
        if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
        error.textContent = requestError.message || "No se pudo reprogramar la cita.";
      } finally {
        this.citaServidorGuardando = false;
        if (boton.isConnected) boton.disabled = false;
      }
    });
  },

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

  nuevoBorrador() {
    return { especialidad: "", medico: "", fecha: "", hora: "", lugar: "" };
  },

agendar() {
    const b = this.borrador;
    const hoy = this.hoyISO();
    const disponibles = Object.keys(this.lugares);
    // El navegador marca la primera opcion aunque ninguna tenga selected, asi
    // que el paciente ve un lugar elegido y el modelo seguia vacio: al enviar
    // sin tocar el selector fallaba con "Completa: lugar".
    if (!b.lugar || !this.lugares[b.lugar]) b.lugar = disponibles[0];
    const lugares = disponibles
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

  resumenCita() {
    const cita = this.citaPendiente;

    if (!cita) return;

    this.modal("Resumen de tu cita", `
      ${this.filas([
        ["Especialidad", cita.especialidad],
        ["Profesional", cita.profesional || cita.medico],
        ["Fecha", this.fechaCorta(cita.fecha)],
        ["Hora", this.horaTexto(cita.hora)],
        cita.lugar ? ["Lugar", cita.lugar] : null,
        cita.motivo ? ["Motivo", cita.motivo] : null
      ])}
      ${sesionServidorCitas() ? '<p class="file-help">La sede no está registrada. Confirma la ubicación con el centro de salud.</p>' : ""}

      <div class="module-actions">
        <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Volver / Modificar</button>
        <button type="button" class="btn btn-primary"  data-action="citas:confirmar">Confirmar cita</button>
      </div>
    `, true);
  },

  confirmarCita() {
    if (!this.citaPendiente) return;
    if (sesionServidorCitas()) {
      this.confirmarCitaServidor();
      return;
    }

    const nueva = { ...this.citaPendiente, id: Date.now() };

    this.citas.push(nueva);
    this.citaPendiente = null;
    this.borrador = this.nuevoBorrador();

    const fecha = new Date(nueva.fecha + "T12:00:00");

    this.mes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    this.diaSeleccionado = nueva.fecha;

    this.render();

    // Sin servidor de reservas no se puede decir que la cita este reservada:
    // se confirmo una seleccion guardada en este dispositivo.
    this.modal("Cita añadida a tu dispositivo", `
      <div class="result-box result-ok">
        <i data-icon="circle-check"></i>
        <p>Tu cita se guardó en este dispositivo.</p>
      </div>
      <p class="file-help">
        No se ha reservado en ningún centro: la disponibilidad todavía no está
        conectada a un servidor. Confírmala por teléfono antes de ir.
      </p>

      ${this.filas([
        ["Especialidad", nueva.especialidad],
        ["Médico", nueva.medico],
        ["Fecha", this.fechaCorta(nueva.fecha)],
        ["Hora", this.horaTexto(nueva.hora)],
        ["Lugar", nueva.lugar],
        ["Dirección", nueva.direccion],
        ["Estado", this.insignia(nueva.estado), true]
      ])}

      <div class="module-actions">
        <button type="button" class="btn btn-primary"  data-action="citas:ir" data-vista="proximas">Ver próximas citas</button>
        <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Agendar otra</button>
      </div>
    `, true);
  },

  async confirmarCitaServidor() {
    if (this.citaServidorGuardando || !this.citaPendiente) return;
    this.citaServidorGuardando = true;
    const token = window.MediApi.storage.getToken();
    const pendiente = this.citaPendiente;
    try {
      const creada = await window.MediApi.citas.createMine({
        personalId: pendiente.personalId,
        fechaHora: pendiente.fechaHoraISO,
        motivo: pendiente.motivo || ""
      });
      if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
      const cita = this.citaDesdeServidor(creada);
      this.citas = this.citas.filter((existente) => existente.id !== cita.id);
      this.citas.push(cita);
      this.citaPendiente = null;
      this.borrador = this.nuevoBorrador();
      this.citasServidorCargadas = true;
      this.pestaña = "proximas";
      this.mes = new Date(new Date(cita.fecha + "T12:00:00").getFullYear(),
        new Date(cita.fecha + "T12:00:00").getMonth(), 1);
      this.diaSeleccionado = cita.fecha;
      this.render();
      this.modal("Cita reservada", `
        <div class="result-box result-ok">
          <i data-icon="circle-check"></i>
          <p>La cita se guardó en tu cuenta.</p>
        </div>
        ${this.filas([
          ["Especialidad", cita.especialidad],
          ["Profesional", cita.profesional],
          ["Fecha", this.fechaCorta(cita.fecha)],
          ["Hora", this.horaTexto(cita.hora)],
          ["Estado", this.insignia(cita.estado), true]
        ])}
        <p class="file-help">Confirma la sede con el centro de salud antes de asistir.</p>
        <div class="module-actions">
          <button type="button" class="btn btn-primary" data-action="citas:ir" data-vista="proximas">Ver próximas citas</button>
          <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cerrar</button>
        </div>`);
    } catch (error) {
      if (!sesionServidorCitas() || token !== window.MediApi.storage.getToken()) return;
      this.modal("No se pudo reservar la cita", `
        <p class="error-msg" role="alert">${this.escapar(error.message || "Inténtalo nuevamente.")}</p>
        <div class="module-actions">
          <button type="button" class="btn btn-primary" data-action="citas:confirmar">Reintentar</button>
          <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cerrar</button>
        </div>`);
    } finally {
      this.citaServidorGuardando = false;
    }
  },

  pedirFinalizar(id) {
    const cita = this.buscarCita(id);

    if (!cita || cita.estado !== "Próxima") return;

    this.modal("¿Deseas marcar esta cita como atendida?", `
      ${this.resumenCompacto(cita)}

      <div class="module-actions">
        <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cancelar</button>
        <button type="button" class="btn btn-primary"  data-action="citas:finalizar" data-id="${id}">Finalizar</button>
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
        <p>La consulta quedó marcada como atendida en este dispositivo.</p>
      </div>

      <div class="module-actions">
        <button type="button" class="btn btn-primary"  data-action="documentos:form" data-id="${id}">Subir archivo</button>
        <button type="button" class="btn btn-outline"  data-action="citas:omitir-documento">Omitir</button>
      </div>
    `, true);
  },

  omitirDocumento() {
    this.close();
    this.avisoLocal("Cita marcada como atendida. Ya aparece en el historial.");
  },

  buscarCita(id) {
    return this.citas.find((c) => c.id === id);
  },
};

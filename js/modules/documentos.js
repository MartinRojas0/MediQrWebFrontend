// ==========================================================
// MediQR · Vista Documentos
//
// Listado, filtros, subida, descarga y eliminacion.
//
// Se registra en MediPartes y luego js/data/store.js lo recombina en un
// unico objeto con Object.assign, de modo que 'this.' sigue resolviendo
// igual que antes. Sin empaquetador: el proyecto carga scripts clasicos,
// asi que no se usan 'import' ni 'export' nativos.
// ==========================================================
window.MediPartes = window.MediPartes || {};

function sesionServidorDocumentos() {
  return Boolean(window.MediApi && window.MediApi.storage &&
    window.MediApi.storage.getToken() &&
    !(window.AccesoModulo && window.AccesoModulo.sesion &&
      window.AccesoModulo.sesion.esDemo));
}

window.MediPartes.documentos = {
  documentosServidor: [],
  documentosServidorToken: null,
  documentosServidorCargados: false,
  documentosServidorCargando: false,
  documentoPreviewUrl: null,

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

  documents() {
    const demoNote = document.getElementById("doc-demo-note");
    if (sesionServidorDocumentos()) {
      if (demoNote) demoNote.classList.add("hidden");
      const token = window.MediApi.storage.getToken();
      if (token !== this.documentosServidorToken) {
        this.liberarPreviewDocumento();
        this.documentosServidor = [];
        this.documentosServidorToken = token;
        this.documentosServidorCargados = false;
        this.documentosServidorCargando = false;
      }
      const contenido = document.getElementById("documents-content");
      const contador = document.getElementById("doc-count");
      if (contador) contador.textContent = "";
      if (contenido) {
        contenido.innerHTML = '<p class="empty-state" role="status">Los documentos médicos están temporalmente deshabilitados.</p>';
      }
      return;
    }
    if (demoNote) demoNote.classList.remove("hidden");

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

    // El movil distingue el biblioteca vacia de un filtro sin resultados.
    // El web tambien: un filtro sin coincidencias no debe sugerir que el
    // paciente no tiene documentos.
    const hayFiltro = !!(busqueda.trim() || tipo !== "Todos" || desde || hasta);
    contenido.innerHTML = resultados.length > 0
      ? resultados.map((doc) => this.tarjetaDocumento(doc)).join("")
      : hayFiltro
        ? '<div class="empty-state">'
          + '<i data-icon="folder-open"></i>'
          + '<p><strong>Sin coincidencias</strong></p>'
          + '<p class="text-muted">Ningún documento cumple los filtros actuales.</p>'
          + '<button class="btn btn-outline-sm" data-action="documentos:limpiar-filtros">'
          + '<i data-icon="circle-xmark"></i> Limpiar filtros</button>'
          + '</div>'
        : '<div class="empty-state">'
          + '<i data-icon="folder-open"></i>'
          + '<p><strong>No hay documentos subidos</strong></p>'
          + '<p class="text-muted">Aquí verás tus recetas, exámenes e informes.</p>'
          + '</div>';

    if (hayFiltro) MediIcons.render(contenido);

    this.marcarMenu();
  },

  async cargarDocumentosServidor(token) {
    const contenido = document.getElementById("documents-content");
    this.documentosServidorCargando = true;
    if (contenido) contenido.innerHTML = '<p class="text-muted" role="status">Cargando tus documentos...</p>';
    try {
      const documents = await window.MediApi.documentos.listMine();
      if (!sesionServidorDocumentos() || token !== window.MediApi.storage.getToken()) return;
      this.documentosServidor = documents;
      this.documentosServidorCargados = true;
      this.renderDocumentosServidor();
    } catch (error) {
      if (!sesionServidorDocumentos() || token !== window.MediApi.storage.getToken()) return;
      const container = document.getElementById("documents-content");
      if (container) {
        container.innerHTML = `<p class="error-msg" role="alert">${this.escapar(
          error.message || "No se pudieron cargar tus documentos."
        )}</p>`;
      }
    } finally {
      if (token === this.documentosServidorToken) this.documentosServidorCargando = false;
    }
  },

  renderDocumentosServidor() {
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

    const results = this.documentosServidor
      .filter((doc) => {
        const text = this.normalizar([doc.nombreArchivo, doc.tipo].filter(Boolean).join(" "));
        return text.includes(busqueda) &&
          (tipo === "Todos" || doc.tipo === tipo) &&
          (!desde || doc.fechaDocumento >= desde) &&
          (!hasta || doc.fechaDocumento <= hasta);
      })
      .sort((a, b) => b.fechaDocumento.localeCompare(a.fechaDocumento));
    const hasFilters = Boolean(busqueda || tipo !== "Todos" || desde || hasta);
    contador.textContent = `${results.length} documento` + (results.length === 1 ? "" : "s");
    contenido.innerHTML = results.length
      ? results.map((doc) => this.tarjetaDocumentoServidor(doc)).join("")
      : hasFilters
        ? '<div class="empty-state">'
          + '<i data-icon="folder-open"></i>'
          + '<p><strong>Sin coincidencias</strong></p>'
          + '<p class="text-muted">Ningún documento cumple los filtros actuales.</p>'
          + '<button class="btn btn-outline-sm" data-action="documentos:limpiar-filtros">'
          + '<i data-icon="circle-xmark"></i> Limpiar filtros</button>'
          + '</div>'
        : '<div class="empty-state"><i data-icon="folder-open"></i><p><strong>No hay documentos subidos</strong></p><p class="text-muted">Aquí verás tus recetas, exámenes e informes guardados en tu cuenta.</p></div>';
    MediIcons.render(contenido);
    this.marcarMenu();
  },

  tarjetaDocumentoServidor(doc) {
    return `
      <article class="card doc-card">
        <div class="doc-card-top">
          <span class="document-icon" aria-hidden="true">
            <i data-icon="${this.iconoArchivo(doc.nombreArchivo)}"></i>
            <small>${this.escapar(this.extension(doc.nombreArchivo).toUpperCase())}</small>
          </span>
          <h3 class="doc-name">${this.escapar(doc.nombreArchivo)}</h3>
        </div>
        ${this.filas([
          ["Tipo", doc.tipo],
          ["Fecha", this.fechaCorta(doc.fechaDocumento)],
          ["Tamaño", this.bytesLegibles(doc.sizeBytes)]
        ])}
        <div class="module-actions">
          <button type="button" class="btn btn-outline" data-action="documentos:ver" data-id="${doc.id}">Ver</button>
          <button type="button" class="btn btn-secondary" data-action="documentos:descargar" data-id="${doc.id}">Descargar</button>
          <button type="button" class="btn btn-danger" data-action="documentos:pedir-eliminar" data-id="${doc.id}">Eliminar</button>
        </div>
      </article>`;
  },

  bytesLegibles(value) {
    const bytes = Number(value) || 0;
    return bytes < 1024 * 1024
      ? Math.max(1, Math.ceil(bytes / 1024)) + " KB"
      : (bytes / (1024 * 1024)).toFixed(1) + " MB";
  },

  buscarDocumentoServidor(id) {
    return this.documentosServidor.find((doc) => Number(doc.id) === Number(id));
  },

  liberarPreviewDocumento() {
    if (this.documentoPreviewUrl) URL.revokeObjectURL(this.documentoPreviewUrl);
    this.documentoPreviewUrl = null;
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
          <button type="button" class="btn btn-outline"  data-action="documentos:ver" data-id="${doc.id}">Ver</button>
          <button type="button" class="btn btn-secondary"  data-action="documentos:descargar" data-id="${doc.id}">Descargar</button>
          <button type="button" class="btn btn-danger"  data-action="documentos:pedir-eliminar" data-id="${doc.id}">Eliminar</button>
        </div>
      </article>
    `;
  },

  buscarDoc(id) {
    return this.documentos.find((d) => d.id === id);
  },

  verDocumento(id) {
    if (sesionServidorDocumentos()) {
      this.verDocumentoServidor(id);
      return;
    }
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
        <button type="button" class="btn btn-secondary"  data-action="documentos:descargar" data-id="${doc.id}">Descargar</button>
        <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cerrar</button>
      </div>
    `);
  },

  async verDocumentoServidor(id) {
    const doc = this.buscarDocumentoServidor(id);
    if (!doc) return;
    this.liberarPreviewDocumento();
    try {
      const blob = await window.MediApi.documentos.contentMine(id, false);
      const url = URL.createObjectURL(blob);
      this.documentoPreviewUrl = url;
      const preview = doc.contentType === "application/pdf"
        ? `<iframe class="doc-preview-frame" src="${url}" title="Vista previa de ${this.atributo(doc.nombreArchivo)}"></iframe>`
        : `<img class="doc-preview-img" src="${url}" alt="Vista previa de ${this.atributo(doc.nombreArchivo)}">`;
      this.modal("Documento médico", `
        ${preview}
        ${this.filas([
          ["Nombre", doc.nombreArchivo],
          ["Tipo", doc.tipo],
          ["Fecha", this.fechaCorta(doc.fechaDocumento)],
          ["Tamaño", this.bytesLegibles(doc.sizeBytes)]
        ])}
        <div class="module-actions">
          <button type="button" class="btn btn-secondary" data-action="documentos:descargar" data-id="${doc.id}">Descargar</button>
          <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cerrar</button>
        </div>`);
      const dialog = document.getElementById("module-dialog");
      const currentUrl = url;
      dialog.addEventListener("close", () => {
        if (this.documentoPreviewUrl === currentUrl) this.liberarPreviewDocumento();
      }, { once: true });
    } catch (error) {
      this.aviso(error.message || "No se pudo abrir el documento.");
    }
  },

  descargarDocumento(id) {
    if (sesionServidorDocumentos()) {
      this.descargarDocumentoServidor(id);
      return;
    }
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

  async descargarDocumentoServidor(id) {
    const doc = this.buscarDocumentoServidor(id);
    if (!doc) return;
    try {
      const blob = await window.MediApi.documentos.contentMine(id, true);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.nombreArchivo;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      this.aviso(error.message || "No se pudo descargar el documento.");
    }
  },

  pedirEliminar(id) {
    if (sesionServidorDocumentos()) {
      const doc = this.buscarDocumentoServidor(id);
      if (!doc) return;
      this.modal("¿Deseas eliminar este documento?", `
        ${this.filas([
          ["Nombre", doc.nombreArchivo],
          ["Tipo", doc.tipo],
          ["Fecha", this.fechaCorta(doc.fechaDocumento)]
        ])}
        <div class="module-actions">
          <button type="button" class="btn btn-outline" data-action="modal:cerrar">Volver</button>
          <button type="button" class="btn btn-danger" data-action="documentos:eliminar" data-id="${id}">Eliminar</button>
        </div>`, true);
      return;
    }
    const doc = this.buscarDoc(id);

    if (!doc) return;

    this.modal("¿Deseas eliminar este documento?", `
      ${this.filas([
        ["Nombre", doc.nombre],
        ["Tipo", doc.tipo],
        ["Fecha", this.fechaCorta(doc.fecha)]
      ])}

      <div class="module-actions">
        <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Volver</button>
        <button type="button" class="btn btn-danger"  data-action="documentos:eliminar" data-id="${id}">Eliminar</button>
      </div>
    `, true);
  },

  eliminarDocumento(id) {
    if (sesionServidorDocumentos()) {
      this.eliminarDocumentoServidor(id);
      return;
    }
    const doc = this.buscarDoc(id);

    if (!doc) return;

    if (doc.url) URL.revokeObjectURL(doc.url);

    this.documentos = this.documentos.filter((d) => d.id !== id);

    this.close();
    this.documents();
    this.avisoLocal("Documento eliminado.");
  },

  async eliminarDocumentoServidor(id) {
    const doc = this.buscarDocumentoServidor(id);
    if (!doc) return;
    try {
      await window.MediApi.documentos.deleteMine(id);
      this.documentosServidor = this.documentosServidor.filter((item) => Number(item.id) !== Number(id));
      this.close();
      this.renderDocumentosServidor();
      this.aviso("Documento eliminado de tu cuenta.");
    } catch (error) {
      this.aviso(error.message || "No se pudo eliminar el documento.");
    }
  },

  documentForm(citaId = null) {
    if (sesionServidorDocumentos()) {
      this.documentFormServidor();
      return;
    }
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
      <p class="file-help wide">El archivo se guarda solo en este dispositivo:
      no se sube a ningún servidor, así que no podrás compartirlo con un médico
      ni recuperarlo si recargas la página.</p>

        <div class="module-actions wide">
          <button type="submit" class="btn btn-primary">Subir archivo</button>
          <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cancelar</button>
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
          <p>El archivo se añadió a tu biblioteca en este dispositivo.</p>
          <p class="file-help">No se ha subido a ningún servidor: se pierde al
          recargar la página y no podrás compartirlo con un médico.</p>
        </div>

        ${this.filas([
          ["Archivo", nuevo.nombre],
          ["Tipo", nuevo.tipo],
          ["Fecha", this.fechaCorta(nuevo.fecha)],
          ["Consulta relacionada", this.resolverDoc(nuevo).consulta]
        ])}

        <div class="module-actions">
          <button type="button" class="btn btn-primary"  data-action="documentos:ir" data-vista="Todos">Ir a Todos los documentos</button>
          <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cerrar</button>
        </div>
      `, true);

      // Actualizar la lista si el paciente ya está viendo documentos
      if (!document.getElementById("view-documentos").classList.contains("hidden")) {
        this.limpiarFiltrosDoc();
        this.documents();
      }
    }
  },

  documentFormServidor() {
    const today = this.hoyISO();
    const defaultType = this.vistasDoc[this.docVista].tipo || "Receta";
    const types = ["Receta", "Examen", "Informe", "Otro"]
      .map((type) => `<option ${type === defaultType ? "selected" : ""}>${type}</option>`)
      .join("");

    this.modal("Subir documento", `
      <form id="document-form" class="module-form" novalidate>
        <label class="wide">
          Seleccionar archivo
          <input name="archivo" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required>
          <span class="file-help">PDF, JPG o PNG · Máximo 10 MB. El archivo se guarda en el almacenamiento privado de tu cuenta.</span>
        </label>
        <label>
          Tipo de documento
          <select name="tipo" required>${types}</select>
        </label>
        <label>
          Fecha del documento
          <input name="fecha" type="date" value="${today}" max="${today}" required>
        </label>
        <p id="document-error" class="error-msg wide hidden" role="alert"></p>
        <div class="module-actions wide">
          <button type="submit" class="btn btn-primary">Subir archivo</button>
          <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cancelar</button>
        </div>
      </form>`);

    document.getElementById("document-form").onsubmit = async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const file = form.elements.archivo.files[0];
      const tipo = form.elements.tipo.value;
      const fecha = form.elements.fecha.value;
      const error = document.getElementById("document-error");
      const submit = form.querySelector('button[type="submit"]');
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      const ext = this.extension(file ? file.name : "");

      error.classList.add("hidden");
      if (!file) {
        error.textContent = "Selecciona un archivo.";
      } else if (file.size === 0 || file.size > 10 * 1024 * 1024) {
        error.textContent = "El archivo debe tener contenido y pesar como máximo 10 MB.";
      } else if (!allowedTypes.includes(file.type) ||
                 !["pdf", "jpg", "jpeg", "png"].includes(ext)) {
        error.textContent = "El archivo debe ser un PDF, JPG o PNG válido.";
      } else if (!fecha || fecha > today) {
        error.textContent = "La fecha del documento no puede estar en el futuro.";
      } else {
        submit.disabled = true;
        try {
          await window.MediApi.documentos.uploadMine(file, tipo, fecha);
          this.close();
          this.documents();
          this.modal("Documento guardado", `
            <div class="result-box result-ok">
              <i data-icon="circle-check"></i>
              <p>El archivo se guardó en tu cuenta y estará disponible después de volver a iniciar sesión.</p>
            </div>
            <div class="module-actions">
              <button type="button" class="btn btn-primary" data-action="modal:cerrar">Cerrar</button>
            </div>`, true);
        } catch (uploadError) {
          error.textContent = uploadError.message || "No se pudo guardar el archivo.";
          error.classList.remove("hidden");
        } finally {
          submit.disabled = false;
        }
        return;
      }
      error.classList.remove("hidden");
    };
  }
};

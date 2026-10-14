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

window.MediPartes.documentos = {
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
        <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Volver</button>
        <button type="button" class="btn btn-danger"  data-action="documentos:eliminar" data-id="${id}">Eliminar</button>
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
          <p>Tu documento ya está en tu biblioteca.</p>
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
  }
};

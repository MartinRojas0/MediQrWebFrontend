// ==========================================================
// MediQR · Router
//
// Navegacion por hash: #/inicio, #/citas, #/documentos, #/perfil
// y sus sub-vistas (#/citas/agendar, #/documentos/recetas, ...).
//
// El hash se eligio para no depender de reglas de reescritura del servidor:
// cualquier hosting estatico sirve el sitio sin configuracion adicional.
//
// Responsabilidades:
//   - Resolver la ruta desde location.hash
//   - Mostrar una vista y ocultar las demas
//   - Marcar el enlace activo y aria-current="page"
//   - Actualizar el titulo del documento
//   - Mover el foco al encabezado de la vista
//   - Respetar los botones "atras" y "adelante" del navegador
//
// Este es el UNICO punto de control de vistas del portal: switchSection()
// queda como alias compatible hacia aqui.
// ==========================================================

const RUTAS = {
  inicio: { vista: "inicio" },
  salud: { vista: "salud" },
  historial: { vista: "historial" },
  citas: { vista: "citas" },
  documentos: { vista: "documentos" },
  perfil: { vista: "perfil" }
};

const RUTA_INICIAL = "inicio";

const TITULOS = {
  inicio: "MediQR - Inicio",
  salud: "MediQR - Expediente clínico",
  historial: "MediQR - Historial",
  "citas/calendario": "MediQR - Calendario de citas",
  "citas/proximas": "MediQR - Próximas citas",
  "citas/historial": "MediQR - Historial de citas",
  "citas/agendar": "MediQR - Agendar cita",
  documentos: "MediQR - Documentos",
  "documentos/todos": "MediQR - Documentos",
  "documentos/recetas": "MediQR - Recetas médicas",
  "documentos/examenes": "MediQR - Exámenes médicos",
  "documentos/informes": "MediQR - Informes médicos",
  "documentos/otros": "MediQR - Otros documentos",
  perfil: "MediQR - Perfil del paciente"
};

const TITULO_GENERICO = "MediQR - Portal del Paciente";

// "#/citas/agendar/" -> "citas/agendar"
function normalizar(hash) {
  return String(hash || "").replace(/^#/, "").replace(/^\/+|\/+$/g, "");
}

// "citas/agendar" -> { base: "citas", sub: "agendar" }
function partes(ruta) {
  const trozos = ruta.split("/").filter(Boolean);
  return { base: trozos[0] || RUTA_INICIAL, sub: trozos[1] || null };
}

const Router = {
  rutaActual: RUTA_INICIAL,
  rutaAplicada: null,
  alEntrar: null,

  // alEntrar(base, sub, definicion) lo invoca app.js para delegar el render.
  iniciar(alEntrar) {
    if (typeof alEntrar === "function") this.alEntrar = alEntrar;

    window.addEventListener("hashchange", () => {
      const ruta = normalizar(location.hash);
      // Si ir() ya la aplico, no se vuelve a renderizar.
      if (ruta === this.rutaAplicada) return;
      this.resolver(location.hash);
    });

    if (location.hash) {
      this.resolver(location.hash);
    } else {
      this.ir(RUTA_INICIAL, { reemplazar: true });
    }
  },

  ir(ruta, opciones) {
    const destino = "#/" + normalizar(ruta);
    const config = opciones || {};

    // Se resuelve de forma sincrona para que la vista cambie en el mismo
    // ciclo: esperar al evento hashchange dejaba la pantalla old durante
    // un frame y rompia las pruebas que comprueban el estado de inmediato.
    this.resolver(destino);

    if (location.hash === destino) return;

    if (config.reemplazar) {
      location.replace(destino);
    } else {
      location.hash = destino;
    }
  },

  resolver(hash) {
    const ruta = normalizar(hash);
    const { base, sub } = partes(ruta);

    const definicion = RUTAS[base];
    if (!definicion) {
      this.ir(RUTA_INICIAL, { reemplazar: true });
      return;
    }

    const vista = document.getElementById("view-" + definicion.vista);
    if (!vista) return;

    document.querySelectorAll(".view-section").forEach((seccion) => {
      seccion.classList.add("hidden");
    });
    vista.classList.remove("hidden");

    // Quita el estado anterior de la navegacion principal. El selector
// apunta a .app-nav porque la barra inferior en movil y el menu lateral
    // en escritorio son el mismo marcado.
    document.querySelectorAll(".app-nav .nav-item").forEach((enlace) => {
      enlace.classList.remove("active");
      enlace.removeAttribute("aria-current");
    });

    const activo = document.getElementById("nav-" + base);
    if (activo) {
      activo.classList.add("active");
      activo.setAttribute("aria-current", "page");
    }

    // Historial no ocupa una posicion en la barra (en el movil se abre
    // desde Inicio, igual que aqui). Para que la seccion activa siga
    // siendo visible, se marca su tarjeta de acceso, pero solo cuando
    // no hay ya un enlace de navegacion que la represente.
    document.querySelectorAll('.quick-card[data-ruta]').forEach((tarjeta) => {
      const esActual = tarjeta.dataset.ruta === base;
      tarjeta.classList.toggle('active', esActual && !activo);

      if (esActual && !activo) {
        tarjeta.setAttribute('aria-current', 'page');
      } else {
        tarjeta.removeAttribute('aria-current');
      }
    });

    document.querySelectorAll("[data-menu]").forEach((boton) => {
      boton.classList.toggle(
        "active",
        boton.dataset.menu === base && (!sub || boton.dataset.vista === sub)
      );
    });

    const clave = sub ? base + "/" + sub : base;
    document.title = TITULOS[clave] || TITULO_GENERICO;

    if (typeof this.alEntrar === "function") {
      this.alEntrar(base, sub, definicion);
    }

    this.enfocar(vista);

    this.rutaActual = ruta;
    this.rutaAplicada = ruta;
  },

  // El foco se lleva al encabezado: sin esto, un usuario de teclado o de
  // lector de pantalla sigue en el menu sin enterarse del cambio de vista.
  enfocar(vista) {
    const encabezado = vista.querySelector("[data-titulo-vista]") || vista.querySelector("h1, h2");
    if (!encabezado) return;

    if (!encabezado.hasAttribute("tabindex")) {
      encabezado.setAttribute("tabindex", "-1");
    }
    encabezado.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
};

window.Router = Router;
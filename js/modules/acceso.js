// ==========================================================
// MediQR · Acceso del paciente
//
// Con una URL de API, registro y login se verifican en el backend y la sesión
// se restaura validando el JWT. Sin API, solo se permite una demostración
// explícita con datos ficticios en memoria.
// ==========================================================
(function () {
  "use strict";

  const PENDIENTE = {
    titulo: "Recuperación de acceso no disponible",
    texto:
      "Esta versión no puede restablecer contraseñas ni enviar enlaces de recuperación.",
    extra:
      "Contacta al equipo del proyecto. No compartas tu contraseña por correo o chat."
  };

  const API_CONFIGURADA = Boolean(window.MEDIQR_CONFIG && window.MEDIQR_CONFIG.API_URL);
  const DEMO = {
    titulo: "Modo demostración",
    texto: API_CONFIGURADA
      ? "Explora el portal con perfiles ficticios. La demo no usa la API ni modifica cuentas."
      : "No hay servidor local; la demo no autentica ni verifica credenciales.",
    extra: "La identidad PACIENTE es simulada; los cambios solo viven en esta pestaña."
  };
  const CUENTAS_DEMO = [
    { id: "pedro", nombre: "Pedro Demo", correo: "pedro.demo@ejemplo.invalid" },
    { id: "martin", nombre: "Martin Demo", correo: "martin.demo@ejemplo.invalid" },
    { id: "veronica", nombre: "Verónica Demo", correo: "veronica.demo@ejemplo.invalid" }
  ];

  // Estado de navegación común al modo API y a la demostración aislada.
  const sesion = {
    activa: false,
    correo: "",
    onboarding: "", // "", "hecho" u "omitido"
    rol: "",
    esDemo: false,
    demoPersona: ""
  };
  let errorInicial = "";

  // El aviso distingue la cuenta conectada de la demostración local y evita
  // presentarlos como consentimiento clínico.
  const TERMINOS = API_CONFIGURADA ? `
    <div class="legal">
      <h3>Aviso de uso del MVP</h3>
      <p><strong>1. Alcance.</strong> Esta versión permite crear una cuenta e
      ingresar datos del perfil. No es un sistema clínico ni un producto
      sanitario y no debe usarse para tomar decisiones médicas.</p>

      <h3>2. Datos y funciones</h3>
      <ul>
        <li>El correo, nombre de usuario y contraseña se verifican en el servidor;
            la contraseña se almacena como hash.</li>
        <li>El perfil, el historial clínico básico y el contacto de emergencia
            se guardan en la cuenta y se vuelven a consultar al iniciar sesión.</li>
        <li>Las citas, los documentos privados y el QR usan el backend. La
            disponibilidad de citas depende del personal y los horarios
            configurados; los documentos requieren almacenamiento persistente.</li>
        <li>La ficha pública del QR solo muestra los campos médicos seleccionados.
            Medicamentos y recordatorios respetan los permisos del rol y no son
            editables por pacientes en esta versión.</li>
      </ul>

      <h3>3. Uso responsable</h3>
      <p>No ingreses información médica sensible ni uses este MVP para una
      emergencia. Aceptar este aviso no constituye consentimiento médico ni
      acredita cumplimiento de requisitos regulatorios o de privacidad.</p>
    </div>` : `
    <div class="legal">
      <h3>Condiciones de uso de la demostración</h3>
      <p><strong>1. Qué es esta aplicación.</strong> MediQR es una demostración
      funcional del portal del paciente. Todo su contenido —citas, documentos,
      expediente clínico y contactos— son datos de ejemplo inventados.</p>

      <h3>2. Qué no es</h3>
      <ul>
        <li>No es un sistema de historia clínica ni un producto sanitario.</li>
        <li>No hay servidor: nada de lo que escribas se guarda ni se envía.</li>
        <li>No hay autenticación. Cualquier correo y contraseña permiten entrar.</li>
        <li>Las citas que crees no son reservas confirmadas por ninguna clínica.</li>
        <li>El botón de emergencia marca un número real, pero no avisa a ningún servicio.</li>
      </ul>

      <h3>3. Aviso médico</h3>
      <p>La información del expediente es ficticia. <strong>Aceptar estas
      condiciones no constituye consentimiento médico ni autorización clínica
      de ningún tipo</strong>, y no debe usarse para tomar decisiones sobre
      salud. Ante una urgencia real, contacta con los servicios de emergencia.</p>

      <h3>4. Tus datos</h3>
      <p>Lo que escribas permanece en la memoria de esta pestaña y desaparece
      al recargar o cerrar. No se escribe nada en el almacenamiento del
      navegador, ni se envía a ningún servicio externo.</p>

      <h3>5. Registro de la aceptación</h3>
      <p>Esta aceptación no se registra de forma legal ni persistente: no existe
      servidor donde guardarla. Solo sirve para confirmar dentro de la demo
      que has leído estas condiciones.</p>
    </div>`;

  function esc(texto) {
    return MediPartes.dom.escapar(texto);
  }

  function avisoPendiente(id) {
    return `
      <div class="card pending-card" role="note" id="${id}">
        <p class="pending-head">
          <i data-icon="shield-halved"></i> ${esc(PENDIENTE.titulo)}
        </p>
        <p>${esc(PENDIENTE.texto)}</p>
        <p class="text-muted">${esc(PENDIENTE.extra)}</p>
      </div>`;
  }

  function bandaDemo(mostrarPersonas) {
    const personas = mostrarPersonas ? `
        <div class="demo-personas-grid" aria-label="Perfiles ficticios de demostración">
          ${CUENTAS_DEMO.map((cuenta) => `
            <button type="button" class="btn btn-outline demo-persona"
              data-action="acceso:demo" data-persona="${cuenta.id}">
              Entrar como ${esc(cuenta.nombre)}
            </button>`).join("")}
        </div>` : "";
    return `
      <section class="card demo-card" aria-label="Modo demostración">
        <p class="demo-head"><i data-icon="stethoscope"></i> ${esc(DEMO.titulo)}</p>
        <p>${esc(DEMO.texto)}</p>
        <p class="text-muted">${esc(DEMO.extra)}</p>
        ${personas}
      </section>`;
  }

  function bandaAcceso() {
    if (!API_CONFIGURADA) return "";
    return `
      <div class="card pending-card" role="note">
        <p class="pending-head"><i data-icon="shield-halved"></i> Cuenta MediQR</p>
        <p>Inicia sesión con correo o nombre de usuario. El perfil, el historial clínico básico y el contacto de emergencia se recuperan desde tu cuenta.</p>
        <p class="text-muted">Citas, documentos y QR usan el backend configurado. La disponibilidad de citas depende del personal activo; medicamentos y recordatorios conservan las autorizaciones por rol.</p>
      </div>`;
  }

  function campo(clave, etiqueta, tipo, autocompletado, extra) {
    return `
      <label class="wide" for="acc-${clave}">
        ${esc(etiqueta)}
        <span class="input-con-icon">
          <input type="${tipo}" id="acc-${clave}" name="${clave}"
                 autocomplete="${autocompletado}" ${extra || ""}>
          ${clave === "contrasena"
            ? '<button type="button" class="ver-clave" data-action="acceso:ver-clave"' +
              ' aria-label="Mostrar contraseña" aria-pressed="false">' +
              '<i data-icon="eye"></i></button>'
            : ""}
        </span>
      </label>`;
  }

  function boton(texto, idAviso) {
    return `<button type="submit" class="btn btn-primary wide"
      aria-describedby="${idAviso}">${texto}</button>`;
  }

  const VISTAS = {
    acceso: {
      titulo: "Iniciar sesión",
      lead: "Tu salud, tu identidad.",
      campos:
        campo("correo", "Correo electrónico o nombre de usuario", "text", "username",
              'autocapitalize="none" spellcheck="false"') +
        campo("contrasena", "Contraseña", "password", "current-password", 'required'),
      boton: boton("Iniciar sesión", "acceso-demo"),
      pie: '¿No tienes cuenta? <a href="#/acceso/registro" data-action="acceso:ir" data-destino="registro">Regístrate aquí</a>',
      prefijo: "",
      error: "acceso-error",
      extra: '<button type="button" class="btn btn-outline wide" data-action="acceso:recuperar">Olvidé mi contraseña</button>'
    },

    registro: {
      titulo: API_CONFIGURADA ? "Crear una cuenta" : "Crear una cuenta de demostración",
      lead: API_CONFIGURADA
        ? "Registra una cuenta para guardar y recuperar tu perfil."
        : "Registro visual, sin cuenta real.",
      campos:
        campo("correo", "Correo electrónico", "email", "email",
              'inputmode="email" autocapitalize="none" spellcheck="false"') +
        campo("usuario", "Nombre de usuario", "text", "username",
              'autocapitalize="none" spellcheck="false" minlength="3" maxlength="30"') +
        '<small class="wide">3–30 caracteres: letras ASCII, números, punto, guion o guion bajo.</small>' +
        campo("contrasena", "Contraseña", "password", "new-password", 'minlength="8"') +
        campo("repetir", "Confirmar contraseña", "password", "new-password", 'minlength="8"'),
      boton: boton("Continuar", "registro-demo"),
      pie: '¿Ya tienes cuenta? <a href="#/acceso" data-action="acceso:ir" data-destino="acceso">Inicia sesión</a>',
      prefijo: "",
      error: "registro-error",
      extra: ""
    },

    recuperar: {
      titulo: "Recuperar acceso",
      lead: API_CONFIGURADA
        ? "La recuperación de contraseña aún no está disponible."
        : "En la demostración no se envía ningún correo.",
      campos:
        campo("correo", "Correo electrónico", "email", "email",
              'inputmode="email" autocapitalize="none" spellcheck="false"'),
      boton: boton("Enviar enlace", "recuperar-demo"),
      pie: '<a href="#/acceso" data-action="acceso:ir" data-destino="acceso">Volver a iniciar sesión</a>',
      prefijo: "",
      error: "recuperar-error",
      extra: ""
    }
  };

  // --- Validación de formularios ---
  function revisar(sub, errorId) {
    const errores = document.getElementById(errorId);
    if (!errores) return true;

    const correo = document.getElementById("acc-correo");
    const usuario = document.getElementById("acc-usuario");
    const clave = document.getElementById("acc-contrasena");
    const repetida = document.getElementById("acc-repetir");
    const terminos = document.getElementById("acc-terminos");

    const identificador = correo.value.trim();
    if (!identificador) {
      errores.textContent = sub === "acceso"
        ? "Escribe tu correo o nombre de usuario para continuar."
        : "Escribe un correo para continuar.";
      return false;
    }

    const validacionIdentificador = sub === "acceso"
      ? MediValidaciones.identificadorAcceso(identificador)
      : MediValidaciones.email(identificador);
    if (!validacionIdentificador.ok) {
      errores.textContent = sub === "acceso" && identificador.indexOf("@") < 0
        ? validacionIdentificador.mensaje
        : "Revisa el correo electrónico.";
      return false;
    }

    if (sub === "registro" && !MediValidaciones.nombreUsuario(usuario.value).ok) {
      errores.textContent = MediValidaciones.nombreUsuario(usuario.value).mensaje;
      return false;
    }

    if (clave && !clave.value) {
      errores.textContent = "Escribe una contraseña para continuar.";
      return false;
    }

    if (repetida && clave.value !== repetida.value) {
      errores.textContent = "Las contraseñas no coinciden.";
      return false;
    }

    if (sub === "registro" && (clave.value.length < 8 || clave.value.length > 100)) {
      errores.textContent = "La contraseña debe tener entre 8 y 100 caracteres.";
      return false;
    }

    if (terminos && !terminos.checked) {
      errores.textContent = API_CONFIGURADA
        ? "Tienes que leer y aceptar el aviso para continuar."
        : "Tienes que leer y aceptar las condiciones para continuar con la demostración.";
      return false;
    }

    errores.textContent = "";
    return true;
  }

  // Borra la contraseña del DOM en cuanto se deja de usar. No se guarda en
  // ninguna parte, ni siquiera un momento.
  function limpiarClaves() {
    ["acc-contrasena", "acc-repetir"].forEach(function (id) {
      const campo = document.getElementById(id);
      if (campo) campo.value = "";
    });
  }

  function mostrarTerminos() {
    MediModules.modal(API_CONFIGURADA ? "Aviso de uso" : "Condiciones de la demostración", TERMINOS + `
      <div class="module-actions wide">
        <button type="button" class="btn btn-primary" data-action="acceso:aceptar-terminos">
          He leído y acepto
        </button>
        <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cerrar</button>
      </div>
    `, true);
  }

  // --- Entrada en la aplicacion ---
  async function entrar(correo, password, esRegistro, username) {
    const errorElem = document.getElementById(esRegistro ? "registro-error" : "acceso-error");

    // Keep demo-only test runs separate from configured deployments.
    if (!window.MEDIQR_CONFIG || !window.MEDIQR_CONFIG.API_URL) {
      if (window.MediModules && window.MediModules.limpiarEstadoSesion) {
        window.MediModules.limpiarEstadoSesion(true);
      }
      sesion.activa = true;
      sesion.esDemo = true;
      sesion.correo = correo;
      sesion.onboarding = "hecho";
      sesion.rol = "PACIENTE";
      sesion.demoPersona = "";
      mostrarAvisoDemo("Modo demostración local: perfil y datos ficticios.");
      Router.ir("inicio");
      return;
    }

    try {
      if (!window.MediApi) {
        throw new Error("No se pudo cargar el cliente de la API de MediQR.");
      }

      if (esRegistro) {
        await window.MediApi.auth.registro(correo, password, username);
      }

      const authData = await window.MediApi.auth.login(correo, password);
      if (!authData || !authData.token) {
        throw new Error("El servidor no devolvió una sesión válida.");
      }
      if (authData.rol !== "PACIENTE") {
        throw new Error("Esta aplicación web está disponible solo para cuentas de paciente.");
      }

      window.MediApi.storage.setToken(authData.token, true);
      window.MediApi.storage.setUser({
        id: authData.id,
        email: authData.email,
        rol: authData.rol
      }, true);

      sesion.activa = true;
      sesion.esDemo = false;
      sesion.correo = authData.email;
      sesion.rol = authData.rol;
      sesion.demoPersona = "";
      ocultarAvisoDemo();

      if (!window.MediModules || typeof window.MediModules.cargarDatosServidor !== "function" ||
          !(await window.MediModules.cargarDatosServidor())) {
        throw new Error("La sesión inició, pero no se pudo recuperar el perfil desde el servidor. Inténtalo nuevamente.");
      }

      sesion.onboarding = window.MediModules.configuracionInicialCompleta ? "hecho" : "";
      Router.ir(sesion.onboarding ? "inicio" : "onboarding");
    } catch (err) {
      console.error("[Auth Error]", err);
      if (window.MediApi && window.MediApi.storage) window.MediApi.storage.clear();
      sesion.activa = false;
      sesion.esDemo = false;
      sesion.correo = "";
      sesion.onboarding = "";
      sesion.rol = "";
      sesion.demoPersona = "";
      ocultarAvisoDemo();
      if (window.MediModules && window.MediModules.limpiarEstadoSesion) {
        window.MediModules.limpiarEstadoSesion(false);
      }

      // Si el backend no está disponible o falla, informarlo claramente y NO simular una sesión real
      if (errorElem) {
        if (err.message && err.message.includes("Failed to fetch")) {
          errorElem.textContent = "No se pudo conectar con el servidor de MediQR. Comprueba tu conexión e inténtalo nuevamente.";
        } else {
          errorElem.textContent = err.message || "Error al autenticar con el servidor.";
        }
      }
    }
  }

  async function restaurarSesion() {
    if (!window.MEDIQR_CONFIG || !window.MEDIQR_CONFIG.API_URL ||
        !window.MediApi || !window.MediApi.storage.getToken()) {
      return false;
    }

    try {
      const usuario = await window.MediApi.auth.me();
      if (!usuario || !usuario.id || !usuario.email) {
        throw new Error("El servidor no devolvió una cuenta válida.");
      }
      if (usuario.rol !== "PACIENTE") {
        throw new Error("Esta aplicación web está disponible solo para cuentas de paciente.");
      }

      window.MediApi.storage.setUser({
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      }, true);
      sesion.activa = true;
      sesion.esDemo = false;
      sesion.correo = usuario.email;
      sesion.rol = usuario.rol;
      sesion.demoPersona = "";
      ocultarAvisoDemo();

      if (!window.MediModules || !(await window.MediModules.cargarDatosServidor())) {
        throw new Error("No se pudo recuperar el perfil de la cuenta.");
      }
      sesion.onboarding = window.MediModules.configuracionInicialCompleta ? "hecho" : "";
      return true;
    } catch (error) {
      console.warn("[MediQR] No se pudo restaurar la sesión:", error);
      window.MediApi.storage.clear();
      sesion.activa = false;
      sesion.esDemo = false;
      sesion.correo = "";
      sesion.onboarding = "";
      sesion.rol = "";
      sesion.demoPersona = "";
      ocultarAvisoDemo();
      if (window.MediModules && window.MediModules.limpiarEstadoSesion) {
        window.MediModules.limpiarEstadoSesion(false);
      }
      errorInicial = "No se pudo restaurar la sesión anterior. Inicia sesión nuevamente.";
      return false;
    }
  }

  // Entrada explícita en modo demostración (aislado y declarado)
  function mostrarAvisoDemo(mensaje) {
    const banner = document.getElementById("demo-session-banner");
    if (!banner) return;
    banner.textContent = mensaje;
    banner.classList.remove("hidden");
  }

  function ocultarAvisoDemo() {
    const banner = document.getElementById("demo-session-banner");
    if (banner) {
      banner.textContent = "";
      banner.classList.add("hidden");
    }
  }

  function entrarModoDemo(personaId) {
    const cuenta = CUENTAS_DEMO.find((item) => item.id === personaId);
    if (!cuenta) {
      const error = document.getElementById("acceso-error");
      if (error) error.textContent = "Selecciona un perfil de demostración válido.";
      return;
    }

    if (window.MediApi && window.MediApi.storage) window.MediApi.storage.clear();
    if (window.MediModules && window.MediModules.limpiarEstadoSesion) {
      window.MediModules.limpiarEstadoSesion(true, cuenta.id);
    }
    sesion.activa = true;
    sesion.esDemo = true;
    sesion.correo = cuenta.correo;
    sesion.onboarding = "hecho";
    sesion.rol = "PACIENTE";
    sesion.demoPersona = cuenta.id;
    ["acc-correo", "acc-contrasena", "acc-repetir"].forEach((id) => {
      const campo = document.getElementById(id);
      if (campo) campo.value = "";
    });
    mostrarAvisoDemo("DEMO · " + cuenta.nombre + " · PACIENTE simulado. Datos ficticios; no se envían a ningún servidor.");
    limpiarClaves();
    Router.ir("inicio");
  }

  function enviar(sub, errorId) {
    const formulario = document.getElementById(sub + "-form");
    if (!formulario) return;

    formulario.addEventListener("submit", async function (evento) {
      evento.preventDefault();

      if (!revisar(sub, errorId)) return;

      const correo = document.getElementById("acc-correo").value.trim();
      const clave = document.getElementById("acc-contrasena").value;

      const esRegistro = (sub === "registro");
      const username = esRegistro
        ? MediValidaciones.nombreUsuario(document.getElementById("acc-usuario").value).valor
        : "";
      limpiarClaves();
      await entrar(correo, clave, esRegistro, username);
    });
  }

  function render(sub) {
    const destino = document.getElementById("view-acceso");
    if (!destino) return;

    const vista = VISTAS[sub] || VISTAS.acceso;

    destino.innerHTML = `
      <h1 class="heading-1" data-titulo-vista>${esc(vista.titulo)}</h1>
      <p class="view-lead">${esc(vista.lead)}</p>

      <article class="card auth-card">
        <form id="${sub}-form" class="module-form" novalidate>
          ${vista.campos}
          <p id="${vista.error}" class="error-msg wide" role="alert"></p>
          ${vista.boton}
          ${vista.extra}
        </form>
      </article>

      ${bandaAcceso()}
      ${sub === "acceso" ? bandaDemo(true) : !API_CONFIGURADA ? bandaDemo(false) : ""}
      ${sub === "recuperar" ? avisoPendiente("recuperar-demo") : ""}

      <p class="auth-alt">${vista.prefijo}${vista.pie}</p>`;

    // Los términos se piden en el login y en el registro. Recuperar
    // contraseña no los necesita: no crea sesión ni guarda nada.
    if (sub === "acceso" || sub === "registro") {
      const formulario = document.getElementById(sub + "-form");
      formulario.insertAdjacentHTML("beforeend", `
        <div class="terminos-fila wide">
          <label class="check">
            <input type="checkbox" id="acc-terminos">
            <span>He leído y acepto las
              <button type="button" class="enlace-terminos" data-action="acceso:terminos">
                ${API_CONFIGURADA ? "aviso de uso" : "condiciones de la demostración"}</button>
            </span>
          </label>
        </div>`);
    }

    enviar(sub, vista.error);
    if (sub === "acceso" && errorInicial) {
      const error = document.getElementById(vista.error);
      if (error) error.textContent = errorInicial;
      errorInicial = "";
    }
  }

  MediAcciones.definirVarias({
    "acceso:ir": function (el, evento) {
      evento.preventDefault();
      // El enlace al propio login va a "#/acceso", no a "#/acceso/acceso".
      const destino = el.dataset.destino;
      Router.ir(destino === "acceso" ? "acceso" : "acceso/" + destino);
    },
    "acceso:recuperar": function () { Router.ir("acceso/recuperar"); },
    "acceso:terminos": function () { mostrarTerminos(); },
    "acceso:demo": function (el) { entrarModoDemo(el.dataset.persona); },

    "acceso:aceptar-terminos": function () {
      const casilla = document.getElementById("acc-terminos");
      if (casilla) casilla.checked = true;
      MediModules.close();
      const error = document.getElementById("acceso-error");
      const errorRegistro = document.getElementById("registro-error");
      if (error && errorRegistro) error.textContent = "";
      else if (error || errorRegistro) {
        const destino = error || errorRegistro;
        destino.textContent = "";
      }
      MediModules.aviso("Condiciones aceptadas para esta demostración.");
    },

    // Mostrar u ocultar la contraseña.
    "acceso:ver-clave": function (el) {
      const campo = document.getElementById("acc-contrasena");
      if (!campo) return;

      const visible = campo.type === "text";
      campo.type = visible ? "password" : "text";
      el.setAttribute("aria-pressed", String(!visible));
      el.setAttribute("aria-label",
        visible ? "Mostrar contraseña" : "Ocultar contraseña");
    }
  });

  // --- Sesión ---
  const AccesoModulo = {
    render,
    restaurarSesion,
    sesion,
    terminar: function () {
      if (window.MediApi && window.MediApi.storage) {
        window.MediApi.storage.clear();
      }
      sesion.activa = false;
      sesion.esDemo = false;
      sesion.correo = "";
      sesion.onboarding = "";
      sesion.rol = "";
      sesion.demoPersona = "";
      ocultarAvisoDemo();
      if (window.MediModules && window.MediModules.limpiarEstadoSesion) {
        window.MediModules.limpiarEstadoSesion(false);
      }
      Router.ir("acceso");
    },
    estaActiva: function () { return sesion.activa; }
  };

  window.AccesoModulo = AccesoModulo;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { render("acceso"); });
  } else {
    render("acceso");
  }
})();
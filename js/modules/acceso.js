// ==========================================================
// MediQR · Acceso en modo demostración
//
// Qué es y qué NO es
//   Este módulo deja entrar al portal con cualquier correo y contraseña
//   no vacíos, porque el objetivo es poder demostrar el producto de
//   principio a fin.
//
//   NO es autenticación, y no lo aparenta:
//     - No se comprueba si la cuenta existe.
//     - No se verifica ninguna credencial: no hay servidor.
//     - No se llama a la red en ningún momento.
//     - La contraseña no se guarda en ninguna parte: ni memoria, ni
//       localStorage, ni sessionStorage, ni cookie. Se borra del DOM en
//       cuanto se pulsa el botón.
//     - El estado de la sesión es un dato en memoria (un booleano y el
//       correo escrito). Se pierde al recargar, y con él la sesión: eso
//       es lo correcto, porque fingir una sesión persistente daría una
//       sensación de protección que no existe.
//
//   La pantalla lo dice de forma discreta y permanente, y los avisos
//   nunca dicen que el usuario se haya autenticado.
// ==========================================================
(function () {
  "use strict";

  const PENDIENTE = {
    titulo: "Acceso pendiente de integración",
    texto:
      "El inicio de sesión necesita un servidor que verifique las credenciales. " +
      "Esta versión del portal no se conecta a ninguno, así que todavía no se puede " +
      "iniciar sesión ni registrar una cuenta.",
    extra:
      "Mientras tanto, los datos que ves son de demostración y están disponibles " +
      "sin ningún tipo de acceso: no están protegidos."
  };

  const DEMO = {
    titulo: "Modo demostración",
    texto:
      "Entra con cualquier correo y contraseña. No se comprueba nada: no hay " +
      "servidor detrás y nadie verifica tus credenciales.",
    extra:
      "Los datos del portal son de ejemplo y no están protegidos."
  };
  const API_CONFIGURADA = Boolean(window.MEDIQR_CONFIG && window.MEDIQR_CONFIG.API_URL);

  // Estado de la demostración. Solo vive en memoria: recargar la página
  // cierra la sesión, que es lo honesto.
  const sesion = {
    activa: false,
    correo: "",
    onboarding: "" // "", "hecho" u "omitido"
  };
  let errorInicial = "";

  // Texto de los términos. Es una demostración: se deja claro que aceptar
  // no equivale a consentimiento médico ni a autorización clínica, y que
  // esa aceptación no se registra en ningún servidor porque no existe.
  const TERMINOS = API_CONFIGURADA ? `
    <div class="legal">
      <h3>Aviso de uso del MVP</h3>
      <p><strong>1. Alcance.</strong> Esta versión permite crear una cuenta e
      ingresar datos del perfil. No es un sistema clínico ni un producto
      sanitario y no debe usarse para tomar decisiones médicas.</p>

      <h3>2. Datos y funciones</h3>
      <ul>
        <li>El correo y la contraseña se envían al servidor para crear o verificar
            la cuenta; la contraseña se almacena como hash.</li>
        <li>Los datos del perfil se envían al servidor y se guardan en la base
            de datos para recuperarlos al iniciar sesión.</li>
        <li>Citas, documentos, expediente clínico, contactos y alertas todavía
            no están conectados como funciones persistentes.</li>
        <li>El QR de emergencia no está disponible en esta versión.</li>
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

  function bandaDemo() {
    return `
      <div class="card demo-card" role="note">
        <p class="demo-head"><i data-icon="stethoscope"></i> ${esc(DEMO.titulo)}</p>
        <p>${esc(DEMO.texto)}</p>
        <p class="text-muted">${esc(DEMO.extra)}</p>
      </div>`;
  }

  function bandaAcceso() {
      if (!window.MEDIQR_CONFIG || !window.MEDIQR_CONFIG.API_URL) return bandaDemo();
      return `
        <div class="card pending-card" role="note">
          <p class="pending-head"><i data-icon="shield-halved"></i> Cuenta MediQR</p>
          <p>El servidor verifica tu correo y contraseña. El perfil se guarda en tu cuenta y puedes recuperarlo al volver a iniciar sesión.</p>
          <p class="text-muted">Este MVP solo sincroniza el perfil. Citas, documentos y otros datos aún no están conectados.</p>
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
        campo("correo", "Correo electrónico", "email", "username",
              'inputmode="email" autocapitalize="none" spellcheck="false"') +
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
        campo("correo", "Correo electrónico", "email", "username",
              'inputmode="email" autocapitalize="none" spellcheck="false"') +
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
        campo("correo", "Correo electrónico", "email", "username",
              'inputmode="email" autocapitalize="none" spellcheck="false"'),
      boton: boton("Enviar enlace", "recuperar-demo"),
      pie: '<a href="#/acceso" data-action="acceso:ir" data-destino="acceso">Volver a iniciar sesión</a>',
      prefijo: "",
      error: "recuperar-error",
      extra: ""
    }
  };

  // --- Validación mínima de interacción ---
  // Solo campos vacíos, coincidencia de contraseñas y aceptación de los
  // términos. Nada de reglas de credenciales: en una demostración cualquier
  // correo y contraseña sirven.
  function revisar(sub, errorId) {
    const errores = document.getElementById(errorId);
    if (!errores) return true;

    const correo = document.getElementById("acc-correo");
    const clave = document.getElementById("acc-contrasena");
    const repetida = document.getElementById("acc-repetir");
    const terminos = document.getElementById("acc-terminos");

    if (!correo.value.trim()) {
      errores.textContent = "Escribe un correo para continuar.";
      return false;
    }

    if (!correo.validity.valid) {
      errores.textContent = "Revisa el correo electrónico.";
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
  async function entrar(correo, password, esRegistro) {
    const errorElem = document.getElementById(esRegistro ? "registro-error" : "acceso-error");

    // Keep demo-only test runs separate from configured deployments.
    if (!window.MEDIQR_CONFIG || !window.MEDIQR_CONFIG.API_URL) {
      sesion.activa = true;
      sesion.esDemo = true;
      sesion.correo = correo;
      sesion.onboarding = "hecho";
      Router.ir("inicio");
      return;
    }

    try {
      if (!window.MediApi) {
        throw new Error("No se pudo cargar el cliente de la API de MediQR.");
      }

      if (esRegistro) {
        await window.MediApi.auth.registro(correo, password, "PACIENTE");
      }

      const authData = await window.MediApi.auth.login(correo, password);
      if (!authData || !authData.token) {
        throw new Error("El servidor no devolvió una sesión válida.");
      }

      window.MediApi.storage.setToken(authData.token, true);
      window.MediApi.storage.setUser({
        id: authData.id,
        email: authData.email,
        rol: authData.rol
      }, true);

      sesion.activa = true;
      sesion.esDemo = false;
      sesion.correo = correo;
      sesion.onboarding = "hecho";

      if (!window.MediModules || typeof window.MediModules.cargarDatosServidor !== "function" ||
          !(await window.MediModules.cargarDatosServidor())) {
        throw new Error("La sesión inició, pero no se pudo recuperar el perfil desde el servidor. Inténtalo nuevamente.");
      }

      Router.ir("inicio");
    } catch (err) {
      console.error("[Auth Error]", err);
      if (window.MediApi && window.MediApi.storage) window.MediApi.storage.clear();
      sesion.activa = false;
      sesion.esDemo = false;
      sesion.correo = "";
      sesion.onboarding = "";

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

      window.MediApi.storage.setUser({
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      }, true);
      sesion.activa = true;
      sesion.esDemo = false;
      sesion.correo = usuario.email;
      sesion.onboarding = "hecho";

      if (!window.MediModules || !(await window.MediModules.cargarDatosServidor())) {
        throw new Error("No se pudo recuperar el perfil de la cuenta.");
      }
      return true;
    } catch (error) {
      console.warn("[MediQR] No se pudo restaurar la sesión:", error);
      window.MediApi.storage.clear();
      sesion.activa = false;
      sesion.esDemo = false;
      sesion.correo = "";
      sesion.onboarding = "";
      errorInicial = "No se pudo restaurar la sesión anterior. Inicia sesión nuevamente.";
      return false;
    }
  }

  // Entrada explícita en modo demostración (aislado y declarado)
  function entrarModoDemo() {
    sesion.activa = true;
    sesion.esDemo = true;
    sesion.correo = "paciente.demo@ejemplo.invalid";
    sesion.onboarding = "hecho";
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
      limpiarClaves();
      await entrar(correo, clave, esRegistro);
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
      sesion.correo = "";
      sesion.onboarding = "";
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
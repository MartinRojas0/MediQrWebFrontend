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

  // Estado de la demostración. Solo vive en memoria: recargar la página
  // cierra la sesión, que es lo honesto.
  const sesion = {
    activa: false,
    correo: "",
    onboarding: "" // "", "hecho" u "omitido"
  };

  // Texto de los términos. Es una demostración: se deja claro que aceptar
  // no equivale a consentimiento médico ni a autorización clínica, y que
  // esa aceptación no se registra en ningún servidor porque no existe.
  const TERMINOS = `
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
      titulo: "Crear una cuenta de demostración",
      lead: "Registro visual, sin cuenta real.",
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
      lead: "En la demostración no se envía ningún correo.",
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

    if (terminos && !terminos.checked) {
      errores.textContent =
        "Tienes que leer y aceptar las condiciones para continuar con la demostración.";
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
    MediModules.modal("Condiciones de la demostración", TERMINOS + `
      <div class="module-actions wide">
        <button type="button" class="btn btn-primary" data-action="acceso:aceptar-terminos">
          He leído y acepto
        </button>
        <button type="button" class="btn btn-outline" data-action="modal:cerrar">Cerrar</button>
      </div>
    `, true);
  }

  // --- Entrada en la demostración ---
  function entrar(correo) {
    sesion.activa = true;
    sesion.correo = correo;

    // Al entrar se muestra lo que falte: la configuración inicial o el
    // portal. Nunca se vuelve al login, asi que no hay bucle posible.
    Router.ir(sesion.onboarding ? "inicio" : "onboarding");
  }

  function enviar(sub, errorId) {
    const formulario = document.getElementById(sub + "-form");
    if (!formulario) return;

    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();

      if (!revisar(sub, errorId)) return;

      const correo = document.getElementById("acc-correo").value.trim();

      // El registro visual no crea ninguna cuenta: continua por el mismo
      // camino que el login, sin decir que nada se guardo en ningun sitio.
      limpiarClaves();
      entrar(correo);
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

      ${sub === "registro" ? bandaDemo() : bandaDemo()}
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
                condiciones de la demostración</button>
            </span>
          </label>
        </div>`);
    }

    enviar(sub, vista.error);
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
    sesion,
    terminar: function () {
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
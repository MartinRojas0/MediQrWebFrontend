// ==========================================================
// MediQR · Acceso: inicio de sesión, registro y recuperación
//
// Qué es y qué no es
//   La app movil tiene activity_login.xml (correo, contraseña,
//   "INICIAR SESION" y el enlace a registro), pero ninguna clase Java
//   lo usa: es una pantalla dibujada que nunca llego a funcionar. Aqui
//   se reconstruye ese diseño, sin backend.
//
//   No se hace nada de lo que exigiria una sesion real:
//     - No se guardan contrasenas, ni en memoria ni en disco.
//     - No se crea ninguna sesion ni cookie.
//     - No se inventa ningun endpoint: no hay fetch a ninguna parte.
//     - El boton de envio esta deshabilitado y explica por que.
//
//   La razon es sencilla: fingir un acceso con datos locales daria una
//   sensacion de proteccion que no existe. Los datos medicos del portal
//   son de demostracion y estan disponibles sin ningun tipo de acceso.
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

  function campo(clave, etiqueta, tipo, autocompletado, extra) {
    return `
      <label class="wide" for="acc-${clave}">
        ${MediPartes.dom.escapar(etiqueta)}
        <input type="${tipo}" id="acc-${clave}" name="${clave}"
               autocomplete="${autocompletado}" ${extra || ""}>
      </label>`;
  }

  function avisoPendiente(id) {
    return `
      <div class="card pending-card" role="note" id="${id}">
        <p class="pending-head">
          <i data-icon="shield-halved"></i> ${MediPartes.dom.escapar(PENDIENTE.titulo)}
        </p>
        <p>${MediPartes.dom.escapar(PENDIENTE.texto)}</p>
        <p class="text-muted">${MediPartes.dom.escapar(PENDIENTE.extra)}</p>
      </div>`;
  }

  function botonPendiente(texto, idAviso) {
    return `<button type="submit" class="btn btn-primary wide" disabled
                    aria-describedby="${idAviso}">${texto}</button>`;
  }

  const VISTAS = {
    acceso: {
      titulo: "Iniciar sesión",
      lead: "Tu salud, tu identidad.",
      campos:
        campo("correo", "Correo electrónico", "email", "email",
              'inputmode="email" autocapitalize="none" spellcheck="false"') +
        campo("contrasena", "Contraseña", "password", "current-password", 'minlength="8"'),
      boton: botonPendiente("Iniciar sesión", "acceso-pendiente"),
      prefijo: "¿No tienes cuenta? ",
      pie: '<a href="#/registro" data-action="acceso:ir" data-destino="registro">Regístrate aquí</a>',
      extra: '<button type="button" class="btn btn-outline wide" data-action="acceso:recuperar">Olvidé mi contraseña</button>',
      aviso: "acceso-pendiente"
    },
    registro: {
      titulo: "Crear una cuenta",
      lead: "Registro de paciente en MediQR.",
      campos:
        campo("correo", "Correo electrónico", "email", "email",
              'inputmode="email" autocapitalize="none" spellcheck="false"') +
        campo("contrasena", "Contraseña", "password", "new-password", 'minlength="8"') +
        campo("repetir", "Confirmar contraseña", "password", "new-password", 'minlength="8"'),
      boton: botonPendiente("Registrarse", "registro-pendiente"),
      prefijo: "¿Ya tienes cuenta? ",
      pie: '<a href="#/acceso" data-action="acceso:ir" data-destino="acceso">Inicia sesión</a>',
      extra: "",
      aviso: "registro-pendiente"
    },
    recuperar: {
      titulo: "Recuperar acceso",
      lead: "Te enviaremos un enlace para restablecer tu contraseña.",
      campos:
        campo("correo", "Correo electrónico", "email", "email",
              'inputmode="email" autocapitalize="none" spellcheck="false"'),
      boton: botonPendiente("Enviar enlace", "recuperar-pendiente"),
      prefijo: "",
      pie: '<a href="#/acceso" data-action="acceso:ir" data-destino="acceso">Volver a iniciar sesión</a>',
      extra: "",
      aviso: "recuperar-pendiente"
    }
  };

  // Comprobacion en el navegador, sin enviar nada. Solo evita que el
  // formulario se quede incoherente; el envio sigue deshabilitado.
  function revisar(sub, errorId) {
    const errores = document.getElementById(errorId);
    if (!errores) return;

    const correo = document.getElementById("acc-correo").value.trim();
    const clave = document.getElementById("acc-contrasena");
    const repetida = document.getElementById("acc-repetir");

    if (!MediValidaciones.email(correo).ok) {
      if (correo) errores.textContent = "Revisa el correo electrónico.";
      return;
    }

    if (!clave) {
      errores.textContent = "";
      return;
    }

    if (clave.value.length < 8) {
      errores.textContent = "La contraseña debe tener al menos 8 caracteres.";
      return;
    }

    if (repetida && clave.value !== repetida.value) {
      errores.textContent = "Las contraseñas no coinciden.";
      return;
    }

    errores.textContent = "";
  }

  // Cualquier envio termina aqui. No se llama a la red y, sobre todo, no se
  // guarda nada: la contrasena se borra del DOM en cuanto se avisa.
  function envioPendiente(sub, errorId, etiqueta) {
    const errores = document.getElementById(errorId);
    if (errores) {
      errores.textContent = etiqueta +
        " todavía no está disponible: falta conectar el servidor de autenticación.";
    }

    ["acc-contrasena", "acc-repetir"].forEach(function (id) {
      const nodo = document.getElementById(id);
      if (nodo) nodo.value = "";
    });
  }

  function conectar(sub, errorId, etiqueta) {
    const formulario = document.getElementById(sub + "-form");
    if (!formulario) return;

    formulario.addEventListener("input", function () { revisar(sub, errorId); });

    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();
      envioPendiente(sub, errorId, etiqueta);
    });

    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();
    }, true);
  }

  function render(sub) {
    const destino = document.getElementById("view-acceso");
    if (!destino) return;

    const vista = VISTAS[sub] || VISTAS.acceso;

    destino.innerHTML = `
      <h1 class="heading-1" data-titulo-vista>${MediPartes.dom.escapar(vista.titulo)}</h1>
      <p class="view-lead">${MediPartes.dom.escapar(vista.lead)}</p>

      <article class="card auth-card">
        <form id="${sub}-form" class="module-form" novalidate>
          ${vista.campos}
          <p id="${sub}-error" class="error-msg wide" role="alert"></p>
          ${vista.boton}
          ${vista.extra}
        </form>
      </article>

      ${avisoPendiente(vista.aviso)}

      <p class="auth-alt">${vista.prefijo}${vista.pie}</p>`;

    conectar(sub, sub + "-error", vista.titulo);
  }

  MediAcciones.definirVarias({
    "acceso:ir": function (el, evento) {
      evento.preventDefault();
      Router.ir("acceso/" + el.dataset.destino);
    },
    "acceso:recuperar": function () {
      Router.ir("acceso/recuperar");
    }
  });

  window.AccesoModulo = { render };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { render("acceso"); });
  } else {
    render("acceso");
  }
})();
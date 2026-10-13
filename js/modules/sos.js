// ==========================================================
// MediQR · Boton SOS
//
// Fuente de verdad: FragmentoInicio.mostrarFlujoSOS() y
// res/layout/dialog_sos_premium.xml de la app movil.
//
// Se conserva el flujo completo: cuenta atras de 5 segundos, cierre
// automatico, cancelar, enviar alerta y llamar a ambulancia con
// confirmacion. El boton se oculta al bajar y aparece al subir.
//
// DEPENDENCIA PENDIENTE
// "ENVIAR ALERTA" ademas de llamar, en el movil notifica a un servicio
// de alertas. Ese servicio no existe todavia: no hay backend. Aqui la
// parte que si puede funcionar, la llamada, se lanza de verdad; la
// notificacion al servicio se declara como pendiente en vez de
// fingir un exito.
// ==========================================================
(function () {
  "use strict";

  // FragmentoInicio.NUMERO_EMERGENCIA
  const NUMERO_EMERGENCIA = "+51999333222";
  const SEGUNDOS = 5;

  let temporizador = null;
  let panelOriginal = "";

  function panel() {
    return document.getElementById("module-dialog-body");
  }

  function detener() {
    if (temporizador) {
      clearInterval(temporizador);
      temporizador = null;
    }
  }

  function countdown(texto, onCierre) {
    let restantes = SEGUNDOS;
    texto.textContent = "Se cerrará en " + restantes + "s";

    detener();
    temporizador = setInterval(() => {
      restantes -= 1;
      texto.textContent = "Se cerrará en " + restantes + "s";

      if (restantes <= 0) {
        detener();
        onCierre();
      }
    }, 1000);
  }

  function abrir() {
    MediModules.modal("Emergencia Médica", `
      <div class="sos-panel">
        <div class="sos-icon"><i data-icon="triangle-exclamation"></i></div>
        <p id="sos-timer" class="sos-timer" role="timer" aria-live="polite">Se cerrará en ${SEGUNDOS}s</p>
        <p class="text-muted">Si se cierra sin confirmar, no se realiza ninguna acción.</p>

        <div class="module-actions sos-actions">
          <button type="button" class="btn btn-danger" data-action="sos:enviar">
            <i data-icon="bell"></i> ENVIAR ALERTA
          </button>
          <a class="btn btn-primary" href="tel:${NUMERO_EMERGENCIA}" data-action="sos:ambulancia">
            <i data-icon="phone"></i> LLAMAR AMBULANCIA
          </a>
          <button type="button" class="btn btn-outline" data-action="sos:cancelar">CANCELAR</button>
        </div>
      </div>
    `, true);

    countdown(document.getElementById('sos-timer'), () => {
      MediModules.close();
      MediModules.aviso("La alerta SOS se cerró sin confirmar.");
    });
  }

  // El enlace tel: no debe pasar por el delegado: abrirlo es la accion.
  function ambulancia() {
    confirmarLlamada();
  }

  function confirmarLlamada() {
    // Se guarda el panel original para poder restaurar la cuenta atras,
    // igual que handler.postDelayed(ejecutable, 1000) en la app movil.
    panelOriginal = panel().innerHTML;

    panel().innerHTML = `
      <p>¿Llamar a tu contacto de emergencia?</p>
      <div class="module-actions">
        <button type="button" class="btn btn-outline" data-action="sos:reanudar">CANCELAR</button>
        <button type="button" class="btn btn-primary" data-action="sos:confirmar-llamada">LLAMAR</button>
      </div>`;
    document.getElementById("module-dialog-title").textContent = "Confirmar Llamada";
  }

  function reanudar() {
    panel().innerHTML = panelOriginal;
    document.getElementById("module-dialog-title").textContent = "Emergencia Médica";
    countdown(document.getElementById('sos-timer'), () => {
      MediModules.close();
      MediModules.aviso("La alerta SOS se cerró sin confirmar.");
    });
  }

  function abrirMarcador() {
    detener();
    window.location.href = "tel:" + NUMERO_EMERGENCIA;
    MediModules.close();
    MediModules.aviso("Marcando al número de emergencia. El aviso al servicio todavía no está conectado.");
  }

  MediAcciones.definirVarias({
    "sos:abrir": function () { abrir(); },
    "sos:cancelar": function () { detener(); MediModules.close(); },
    "sos:enviar": function () { abrirMarcador(); },
    "sos:ambulancia": function (el, evento) { evento.preventDefault(); ambulancia(); },
    "sos:confirmar-llamada": function () { abrirMarcador(); },
    // Al cancelar la llamada se restaura el panel y la cuenta atras.
    "sos:reanudar": function () { reanudar(); }
  });

  // El boton se oculta al bajar y reaparece al subir
  // (onScrollChangeListener de FragmentoInicio).
  function conectarScroll() {
    let ultimoY = window.scrollY;

    window.addEventListener("scroll", () => {
      const boton = document.getElementById("sos-boton");
      if (!boton) return;

      const y = window.scrollY;
      const bajando = y > ultimoY + 12;
      const subiendo = y < ultimoY - 12;

      if (bajando) boton.classList.add("sos-oculto");
      else if (subiendo) boton.classList.remove("sos-oculto");

      if (bajando || subiendo) ultimoY = y;
    }, { passive: true });
  }

  function montar() {
    if (document.getElementById("sos-boton")) return;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.id = "sos-boton";
    boton.className = "sos-boton";
    boton.setAttribute("data-action", "sos:abrir");
    boton.setAttribute("aria-label", "Emergencia médica SOS");
    boton.innerHTML = '<i data-icon="heart-pulse"></i><span>SOS</span>';

    document.body.appendChild(boton);
    conectarScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar);
  } else {
    montar();
  }
})();
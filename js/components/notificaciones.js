// ==========================================================
// MediQR · Avisos de actividad de la sesión actual
//
// El centro muestra confirmaciones que la propia app ya genera. No consulta
// ni simula avisos del servidor y su contenido solo vive en memoria.
// ==========================================================
(function () {
  "use strict";

  const avisos = [];
  let siguienteId = 0;
  const limite = 40;

  function elementos() {
    return {
      boton: document.getElementById("notification-button"),
      contador: document.getElementById("notification-count"),
      panel: document.getElementById("notification-panel"),
      lista: document.getElementById("notification-list"),
      vacio: document.getElementById("notification-empty"),
      leerTodas: document.getElementById("notification-read-all"),
    };
  }

  function cerrar(enfocarBoton) {
    const ui = elementos();
    if (!ui.panel || !ui.boton) return;
    ui.panel.classList.add("hidden");
    ui.boton.setAttribute("aria-expanded", "false");
    if (enfocarBoton) ui.boton.focus();
  }

  function marcarLeida(id) {
    const aviso = avisos.find((item) => item.id === id);
    if (!aviso || aviso.leido) return;
    aviso.leido = true;
    render();
    const fila = document.getElementById("notification-item-" + id);
    if (fila) fila.focus();
  }

  function marcarTodasLeidas() {
    avisos.forEach((aviso) => { aviso.leido = true; });
    render();
    const ui = elementos();
    if (ui.leerTodas) ui.leerTodas.focus();
  }

  function alternar() {
    const ui = elementos();
    if (!ui.boton || !ui.panel) return;
    const abierto = ui.panel.classList.contains("hidden");
    ui.panel.classList.toggle("hidden", !abierto);
    ui.boton.setAttribute("aria-expanded", String(abierto));
  }

  function agregarAviso(evento) {
    const mensaje = evento && evento.detail && evento.detail.mensaje;
    if (typeof mensaje !== "string" || !mensaje.trim()) return;

    avisos.unshift({
      id: ++siguienteId,
      mensaje: mensaje.trim(),
      creado: new Date(),
      leido: false,
    });
    if (avisos.length > limite) avisos.pop();
    render();
  }

  function crearFila(aviso) {
    const fila = document.createElement("li");
    fila.id = "notification-item-" + aviso.id;
    fila.tabIndex = -1;
    fila.className = "notification-item" + (aviso.leido ? "" : " is-unread");

    const meta = document.createElement("div");
    meta.className = "notification-item-meta";

    const estado = document.createElement("span");
    estado.className = "notification-item-state";
    estado.textContent = aviso.leido ? "Leído" : "Nuevo";

    const hora = document.createElement("time");
    hora.dateTime = aviso.creado.toISOString();
    hora.textContent = aviso.creado.toLocaleString("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
      hourCycle: "h23",
    });
    meta.append(estado, hora);

    const mensaje = document.createElement("p");
    mensaje.className = "notification-item-message";
    mensaje.textContent = aviso.mensaje;
    fila.append(meta, mensaje);

    if (!aviso.leido) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "notification-mark-read";
      boton.dataset.action = "notificaciones:marcar-leida";
      boton.dataset.id = String(aviso.id);
      boton.textContent = "Marcar como leída";
      fila.appendChild(boton);
    }

    return fila;
  }

  function render() {
    const ui = elementos();
    if (!ui.boton || !ui.contador || !ui.panel || !ui.lista || !ui.vacio || !ui.leerTodas) return;

    const sinLeer = avisos.filter((aviso) => !aviso.leido).length;
    ui.contador.textContent = sinLeer > 99 ? "99+" : String(sinLeer);
    ui.contador.hidden = sinLeer === 0;
    ui.boton.setAttribute(
      "aria-label",
      sinLeer ? "Notificaciones, " + sinLeer + " sin leer" : "Notificaciones, sin avisos nuevos"
    );
    ui.leerTodas.disabled = sinLeer === 0;
    ui.vacio.classList.toggle("hidden", avisos.length > 0);
    ui.lista.replaceChildren();

    const fragmento = document.createDocumentFragment();
    avisos.forEach((aviso) => fragmento.appendChild(crearFila(aviso)));
    ui.lista.appendChild(fragmento);
  }

  function limpiar() {
    avisos.length = 0;
    cerrar(false);
    render();
  }

  function limpiarAlSalir() {
    const ruta = window.location.hash.replace(/^#\/?/, "").split("/")[0];
    if (ruta !== "acceso") return;
    limpiar();
  }

  MediAcciones.definirVarias({
    "notificaciones:alternar": alternar,
    "notificaciones:marcar-leida": function (elemento) {
      marcarLeida(Number(elemento.dataset.id));
    },
    "notificaciones:leer-todas": marcarTodasLeidas,
  });

  window.addEventListener("mediqr:aviso", agregarAviso);
  window.addEventListener("hashchange", limpiarAlSalir);
  document.addEventListener("keydown", function (evento) {
    const ui = elementos();
    if (evento.key === "Escape" && ui.panel && !ui.panel.classList.contains("hidden")) {
      cerrar(true);
    }
  });
  document.addEventListener("click", function (evento) {
    const ui = elementos();
    if (!ui.panel || ui.panel.classList.contains("hidden")) return;
    if (ui.panel.contains(evento.target) || (ui.boton && ui.boton.contains(evento.target))) return;
    cerrar(false);
  });

  window.MediNotifications = { render, clear: limpiar };
  render();
})();

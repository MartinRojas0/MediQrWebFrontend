// ==========================================================
// MediQR · Registro de acciones
//
// Sustituye los manejadores onclick/onsubmit en linea.
//
// Por que: un atributo onclick compila codigo en tiempo de ejecucion,
// no se puede encontrar con una busqueda normal, complica el
// almacenamiento en cache y choca con una politica de seguridad de
// contenido sin "unsafe-inline".
//
// Como funciona
//   <button data-action="citas:detalle" data-id="3">
// Un unico listener por tipo de evento en el documento recibe el clic,
// busca el ancestro mas cercano con data-action y ejecuta la funcion
// registrada con ese nombre.
//
// Las acciones se registran con MediAcciones.definir("nombre", fn).
// La funcion recibe (elemento, evento), de modo que los datos viajan en
// atributos data-* y no en codigo.
// ==========================================================
(function (global) {
  "use strict";

  var registro = Object.create(null);

  var MediAcciones = {
    registro: registro,

    // Registra una accion. Se usa al cargar cada modulo.
    definir: function (nombre, fn) {
      registro[nombre] = fn;
      return MediAcciones;
    },

    // Permite a un modulo registrar varias acciones de una vez.
    definirVarias: function (mapa) {
      Object.keys(mapa).forEach(function (nombre) { registro[nombre] = mapa[nombre]; });
      return MediAcciones;
    },

    ejecutar: function (nombre, elemento, evento) {
      var fn = registro[nombre];

      if (typeof fn !== "function") {
        console.warn("[MediQR] Accion no registrada:", nombre);
        return undefined;
      }

      return fn(elemento, evento);
    },

    // --- Listeners delegados ---
    // click y submit se delegan desde document. input y change tambien,
    // por los filtros de documentos.
    conectar: function (raiz) {
      var contenedor = raiz || document;

      contenedor.addEventListener("click", function (evento) {
        var elemento = evento.target.closest("[data-action]");

        if (!elemento || !contenedor.contains(elemento)) return;

        // Los <a> sin href tambien disparan la accion; se evita que el
        // navegador la siga si algun dia se les pone href.
        if (elemento.tagName === "A" && elemento.getAttribute("href")) {
          evento.preventDefault();
        }

        MediAcciones.ejecutar(elemento.dataset.action, elemento, evento);
      });

      contenedor.addEventListener("submit", function (evento) {
        var elemento = evento.target.closest("[data-action]");

        if (!elemento || !contenedor.contains(elemento)) return;

        evento.preventDefault();
        MediAcciones.ejecutar(elemento.dataset.action, elemento, evento);
      });

      contenedor.addEventListener("input", function (evento) {
        var elemento = evento.target.closest("[data-action]");

        if (!elemento || !contenedor.contains(elemento)) return;

        MediAcciones.ejecutar(elemento.dataset.action, elemento, evento);
      });

      contenedor.addEventListener("change", function (evento) {
        var elemento = evento.target.closest("[data-action]");

        if (!elemento || !contenedor.contains(elemento)) return;

        MediAcciones.ejecutar(elemento.dataset.action, elemento, evento);
      });

      return MediAcciones;
    }
  };

  // ---- Navegacion ----
  MediAcciones.definirVarias({
    "nav:ir": function (el) { global.Router.ir(el.dataset.ruta); },
    "nav:toggle": function (el, evento) { global.MediModules.toggleMenu(evento, el); },

    "citas:ir": function (el) { global.MediModules.irCitas(el.dataset.vista); },
    "documentos:ir": function (el) { global.MediModules.irDocumentos(el.dataset.vista); },

    // ---- Calendario ----
    "citas:seleccionar-dia": function (el) { global.MediModules.selectDay(el.dataset.fecha); },
    "citas:mes": function (el) { global.MediModules.moveMonth(Number(el.dataset.paso)); },
    "citas:hoy": function () { global.MediModules.irHoy(); },

    // ---- Ciclo de una cita ----
    "citas:detalle": function (el) { global.MediModules.detail(Number(el.dataset.id)); },
    "citas:pedir-cancelar": function (el) { global.MediModules.pedirCancelar(Number(el.dataset.id)); },
    "citas:cancelar": function (el) { global.MediModules.cancelar(Number(el.dataset.id)); },
    "citas:pedir-reprogramar": function (el) { global.MediModules.pedirReprogramar(Number(el.dataset.id)); },
    "citas:reprogramar-form": function (el) { global.MediModules.reprogramarForm(Number(el.dataset.id)); },
    "citas:pedir-finalizar": function (el) { global.MediModules.pedirFinalizar(Number(el.dataset.id)); },
    "citas:finalizar": function (el) { global.MediModules.finalizar(Number(el.dataset.id)); },
    "citas:omitir-documento": function () { global.MediModules.omitirDocumento(); },
    "citas:confirmar": function () { global.MediModules.confirmarCita(); },

    // ---- Documentos ----
    "documentos:filtrar": function () { global.MediModules.documents(); },
    "documentos:form": function (el) { global.MediModules.documentForm(el.dataset.id ? Number(el.dataset.id) : null); },
    "documentos:ver": function (el) { global.MediModules.verDocumento(Number(el.dataset.id)); },
    "documentos:descargar": function (el) { global.MediModules.descargarDocumento(Number(el.dataset.id)); },
    "documentos:pedir-eliminar": function (el) { global.MediModules.pedirEliminar(Number(el.dataset.id)); },
    "documentos:eliminar": function (el) { global.MediModules.eliminarDocumento(Number(el.dataset.id)); },

    // ---- Ventana modal ----
    "modal:cerrar": function () { global.MediModules.close(); },
    "qr:ver": function () { global.MediModules.verQr(); },

    // ---- Accesorios todavia no implementados ----
    // Avisan con el toast accesible en lugar de alert(), que bloquea la
    // pagina y no lo anuncia un lector de pantalla de forma fiable.
    "demo:aviso": function (el) {
      global.MediModules.aviso(el.dataset.mensaje + " (funcion pendiente).");
    }
  });

  global.MediAcciones = MediAcciones;
})(window);
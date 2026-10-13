// ==========================================================
// MediQR · Punto de entrada
//
// Arranca el portal: conecta el router con los modulos de vista y
// sincroniza la navegacion del navbar con las rutas.
//
// Por ahora los modulos viven todavia en index.html y en
// js/citasDocumentos.js. Este archivo es el unico que conoce el
// orden de arranque; al extraer cada vista a su modulo, solo se
// tocara este punto y el router.
// ==========================================================

(function iniciarPortal() {
  "use strict";

  function alEntrar(base, sub) {
    if (typeof routerAlEntrar === "function") {
      routerAlEntrar(base, sub);
    }
  }

  function arrancar() {
    if (typeof Router !== "undefined") {
      Router.iniciar(alEntrar);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
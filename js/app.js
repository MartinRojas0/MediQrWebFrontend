// ==========================================================
// MediQR · Punto de entrada
//
// Prepara el estado, conecta el router con las vistas y registra la
// fachada global. Es el unico archivo que conoce el orden de arranque:
// al cambiar cualquier modulo no hay que tocarlo.
// ==========================================================

(function () {
  "use strict";

  // DOC_SLUG y DOC_VISTA se definen en js/components/navbar.js, que es
  // donde se usan.

  // Marcas de arranque.
  function routerAlEntrar(base, sub) {
    if (typeof MediModules === "undefined") return;

    MediModules.cerrarMenus();

    if (base === "citas") {
      MediModules.pestaña = sub || "calendario";
      MediModules.render();
    }

    if (base === "documentos") {
      MediModules.docVista = DOC_VISTA[sub] || "Todos";
      MediModules.documents();
    }
    if (base === "acceso" && window.AccesoModulo) {
      window.AccesoModulo.render(sub || "acceso");
    }
  }

  function registrarMenus() {
    document.querySelectorAll(".nav-trigger").forEach((disparador) => {
      disparador.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          MediModules.toggleMenu(evento, disparador);
        }

        if (evento.key === "Escape") {
          MediModules.cerrarMenus();
        }
      });
    });

    document.querySelectorAll(".nav-dropdown").forEach((menu) => {
      menu.addEventListener("mouseleave", () => menu.classList.remove("cerrado"));
    });

    document.addEventListener("click", () => MediModules.cerrarMenus());
  }

  function arrancar() {
    // 1. Las fechas ya se resolvieron al cargar el store.

    // 2. Menus del navbar.
    registrarMenus();

    // 3. Listeners delegados: un unico punto para click, submit, input y change.
    MediAcciones.conectar(document);

    // 4. Router.
    Router.iniciar(routerAlEntrar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
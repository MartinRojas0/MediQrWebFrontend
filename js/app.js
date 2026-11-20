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

  function actualizarCabecera(base) {
    const rutaCompleta = (base || (window.Router && window.Router.rutaActual) || "inicio").split("/");
    const ruta = rutaCompleta[0];
    const titulos = {
      inicio: "Inicio",
      salud: "Salud",
      citas: "Citas",
      documentos: "Documentos",
      perfil: "Perfil",
      historial: "Historial",
      onboarding: "Configuración inicial",
      acceso: "Acceso",
      qr: "Mi QR",
      ficha: "Ficha de emergencia",
    };
    const subtitulos = {
      calendario: "Calendario",
      proximas: "Próximas",
      historial: "Historial",
      agendar: "Agendar",
      recetas: "Recetas",
      examenes: "Exámenes",
    };
    const titulo = titulos[ruta] || "MediQR";
    const subtitulo = subtitulos[rutaCompleta[1]] || "";
    const migas = document.getElementById("app-crumb");
    if (migas) migas.textContent = subtitulo ? titulo + " · " + subtitulo : titulo;

    const api = window.MediApi;
    const token = api && api.storage && api.storage.getToken();
    const cuenta = token && api.storage.getUser ? api.storage.getUser() || {} : {};
    const paciente = window.MediModules && window.MediModules.paciente || {};
    const correo = token ? (cuenta.email || paciente.email || "") : "";
    const nombrePerfil = token ? [paciente.nombre, paciente.apellidos].filter(Boolean).join(" ").trim() : "";
    const nombre = nombrePerfil || (correo ? correo.split("@")[0] : "Mi cuenta");

    const nombreEl = document.getElementById("app-user-name");
    const correoEl = document.getElementById("app-user-email");
    const avatarEl = document.getElementById("app-user-avatar");
    const boton = document.getElementById("app-user-button");
    if (nombreEl) nombreEl.textContent = nombre;
    if (correoEl) correoEl.textContent = correo;
    if (avatarEl) {
      avatarEl.textContent = nombre.split(/\s+/).filter(Boolean).slice(0, 2)
        .map((parte) => parte.charAt(0)).join("").toUpperCase() || "M";
    }
    if (boton) boton.setAttribute("aria-label", "Abrir perfil de " + nombre);
  }

  window.MediRefrescarCabecera = actualizarCabecera;

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
    if (base === "onboarding" && window.OnboardingModulo) {
      window.OnboardingModulo.render();
    }
    if (base === "qr" && window.QrModulo) window.QrModulo.render();
    if (base === "ficha" && window.QrModulo) window.QrModulo.renderPublica(sub);
    // El marcado de Perfil se crea una sola vez, pero sus datos hay que
    // repintarlos al entrar: el onboarding y el propio guardado cambian el
    // modelo despues de la primera carga, y sin esto la vista se quedaba con
    // los valores antiguos. refrescar() solo toca los campos de lectura.
    if (base === "perfil" && window.PerfilModulo && window.PerfilModulo.refrescar) {
      window.PerfilModulo.refrescar();
    }

    actualizarCabecera(base + (sub ? "/" + sub : ""));
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

  async function arrancar() {
    // 1. Las fechas ya se resolvieron al cargar el store.

    // 2. Menus del navbar.
    registrarMenus();

    // 3. Listeners delegados: un unico punto para click, submit, input y change.
    MediAcciones.conectar(document);

    // Restore a valid server session before the router applies its access guard.
    if (window.AccesoModulo) {
      await window.AccesoModulo.restaurarSesion();
    }

    // 4. Router.
    Router.iniciar(routerAlEntrar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
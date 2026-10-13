// ==========================================================
// MediQR · Navbar
//
// Menus desplegables y navegacion por sub-vistas.
//
// Se registra en MediPartes y luego js/data/store.js lo recombina en un
// unico objeto con Object.assign, de modo que 'this.' sigue resolviendo
// igual que antes. Sin empaquetador: el proyecto carga scripts clasicos,
// asi que no se usan 'import' ni 'export' nativos.
// ==========================================================
window.MediPartes = window.MediPartes || {};

// Los menus usan nombres legibles ("Exámenes"); las rutas usan slugs sin
// acentos ni mayusculas para que la URL sea estable. Los usa irDocumentos()
// y tambien el arranque del router.
window.DOC_SLUG = { Todos: "todos", Recetas: "recetas", "Exámenes": "examenes", Informes: "informes", Otros: "otros" };
window.DOC_VISTA = { todos: "Todos", recetas: "Recetas", examenes: "Exámenes", informes: "Informes", otros: "Otros" };

window.MediPartes.navbar = {
  toggleMenu(evento, elemento) {
    evento.stopPropagation();

    const contenedor = elemento.parentElement;
    const conMouse = window.matchMedia("(hover: hover)").matches;
    const visible =
      getComputedStyle(contenedor.querySelector(".nav-submenu")).display !== "none";

    // Con mouse el menú ya se abre al pasar encima; en pantallas táctiles se alterna
    const abrir = conMouse ? true : !visible;

    this.cerrarMenus();
    contenedor.classList.remove("cerrado");
    contenedor.classList.toggle("open", abrir);
    elemento.setAttribute("aria-expanded", abrir);
  },

  cerrarMenus() {
    document.querySelectorAll(".nav-dropdown").forEach((menu) => {
      menu.classList.remove("open");

      // Si el mouse sigue encima, ocultarlo hasta que salga del menú
      if (menu.matches(":hover")) {
        menu.classList.add("cerrado");
      }

      const disparador = menu.querySelector(".nav-trigger");
      if (disparador) disparador.setAttribute("aria-expanded", "false");
    });
  },

  marcarMenu() {
    const actual = { citas: this.pestaña, documentos: this.docVista };

    document.querySelectorAll("[data-menu]").forEach((boton) => {
      const seccion = boton.dataset.menu;
      const visible = !document
        .getElementById("view-" + seccion)
        .classList.contains("hidden");

      boton.classList.toggle(
        "active",
        visible && boton.dataset.vista === actual[seccion]
      );
    });
  },

  irCitas(vista) {
    this.close();
    Router.ir("citas/" + vista);
  },

  irDocumentos(vista) {
    if (vista !== this.docVista) {
      this.limpiarFiltrosDoc();
    }

    this.close();
    Router.ir("documentos/" + (DOC_SLUG[vista] || "todos"));
  },
};

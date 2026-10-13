// ==========================================================
// MediQR · Ventana modal y avisos
//
// Sobre el <dialog> nativo.
//
// Se registra en MediPartes y luego js/data/store.js lo recombina en un
// unico objeto con Object.assign, de modo que 'this.' sigue resolviendo
// igual que antes. Sin empaquetador: el proyecto carga scripts clasicos,
// asi que no se usan 'import' ni 'export' nativos.
// ==========================================================
window.MediPartes = window.MediPartes || {};

window.MediPartes.modal = {
  modal(titulo, contenido, compacto = false) {
    const ventana = document.getElementById("module-dialog");

    ventana.classList.toggle("compact", compacto);
    document.getElementById("module-dialog-title").textContent = titulo;
    document.getElementById("module-dialog-body").innerHTML = contenido;

    if (!ventana.open) {
      ventana.showModal();
    }
  },

  close() {
    const ventana = document.getElementById("module-dialog");

    if (ventana.open) {
      ventana.close();
    }
  },

  aviso(mensaje) {
    const aviso = document.getElementById("module-notice");

    aviso.textContent = mensaje;
    aviso.classList.remove("hidden");

    clearTimeout(this.temporizadorAviso);

    this.temporizadorAviso = setTimeout(() => {
      aviso.classList.add("hidden");
    }, 4000);
  },
};

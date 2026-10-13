// ==========================================================
// MediQR · Utilidades de escapado
//
// Convierte texto a HTML seguro antes de inyectarlo con innerHTML.
//
// Se registra en MediPartes y luego js/data/store.js lo recombina en un
// unico objeto con Object.assign, de modo que 'this.' sigue resolviendo
// igual que antes. Sin empaquetador: el proyecto carga scripts clasicos,
// asi que no se usan 'import' ni 'export' nativos.
// ==========================================================
window.MediPartes = window.MediPartes || {};

window.MediPartes.dom = {
  escapar(texto) {
    const elemento = document.createElement("span");
    elemento.textContent = texto ?? "";
    return elemento.innerHTML;
  },

  atributo(texto) {
    return this.escapar(texto).replace(/"/g, "&quot;");
  },
};

// ==========================================================
// MediQR · Utilidades de fecha y hora
//
// Funciones puras: no tocan el DOM ni el estado.
//
// Se registra en MediPartes y luego js/data/store.js lo recombina en un
// unico objeto con Object.assign, de modo que 'this.' sigue resolviendo
// igual que antes. Sin empaquetador: el proyecto carga scripts clasicos,
// asi que no se usan 'import' ni 'export' nativos.
// ==========================================================
window.MediPartes = window.MediPartes || {};

window.MediPartes.fechas = {
  fechaISO(fecha) {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${año}-${mes}-${dia}`;
  },

  hoyISO() {
    return this.fechaISO(new Date());
  },

  fechaTexto(fecha) {
    return new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  },

  fechaCorta(fecha) {
    const [año, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${año}`;
  },

  horaTexto(hora) {
    const [h, m] = hora.split(":").map(Number);
    const sufijo = h >= 12 ? "p. m." : "a. m.";
    const h12 = h % 12 || 12;

    return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
  },

  normalizar(texto) {
    return String(texto)
      .toLocaleLowerCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  },
};

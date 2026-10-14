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

  // Formato 24 h. El movil guarda y muestra la hora tal cual ("10:30") y en
  // Peru se usa 24 h; "4:00 p. m." solo aparecia por heredar el formato
  // anglosajon y chocaba con el resto del portal.
  horaTexto(hora) {
    const [h, m] = hora.split(":").map(Number);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  },

  // Edad cumplida a dia de hoy, con el mismo criterio que Validaciones.kt:
  // se descuenta un ano si el aniversario aun no ha llegado.
  edad(fechaISO) {
    if (!fechaISO) return null;
    const [anio, mes, dia] = fechaISO.split("-").map(Number);
    if (!anio) return null;

    const hoy = new Date();
    let edad = hoy.getFullYear() - anio;
    if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) edad -= 1;
    return edad >= 0 ? edad : null;
  },

  normalizar(texto) {
    return String(texto)
      .toLocaleLowerCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  },
};

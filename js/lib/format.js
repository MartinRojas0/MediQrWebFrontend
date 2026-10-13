// ==========================================================
// MediQR · Formateo de presentacion
//
// Insignias, listas etiqueta/valor y titulos de vista.
//
// Se registra en MediPartes y luego js/data/store.js lo recombina en un
// unico objeto con Object.assign, de modo que 'this.' sigue resolviendo
// igual que antes. Sin empaquetador: el proyecto carga scripts clasicos,
// asi que no se usan 'import' ni 'export' nativos.
// ==========================================================
window.MediPartes = window.MediPartes || {};

window.MediPartes.formato = {
  claseEstado(estado) {
    return { "Próxima": "proxima", "Atendida": "atendida", "Cancelada": "cancelada" }[estado] || "proxima";
  },

  insignia(estado) {
    return `<span class="badge status-${this.claseEstado(estado)}">${this.escapar(estado)}</span>`;
  },

  filas(lista) {
    return `
      <div class="info-list">
        ${lista
          .filter(Boolean)
          .map(([etiqueta, valor, html]) => `
            <div class="info-row">
              <span class="info-label">${etiqueta}</span>
              <span class="info-value">${html ? valor : this.escapar(valor)}</span>
            </div>
          `)
          .join("")}
      </div>
    `;
  },

  tituloVista(titulo, subtitulo) {
    return `
      <div class="view-title">
        <h2>${titulo}</h2>
        <p class="text-muted">${subtitulo}</p>
      </div>
    `;
  },
};

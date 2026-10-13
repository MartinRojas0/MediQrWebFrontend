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

  // El QR de emergencia se muestra desde Inicio y desde Perfil, asi que
  // vive en el componente de ventana y no en una vista concreta.
  verQr() {
    this.modal('Código QR de Emergencia', `
      <div class="text-center">
        <div class="qr-frame">
          <svg viewBox="0 0 100 100" role="img"
               aria-label="Código QR de emergencia de demostración">
            <rect width="100" height="100" fill="#ffffff"/>
            <path d="M10 10h30v30H10zM60 10h30v30H60zM10 60h30v30H10z" fill="#2563eb"/>
            <path d="M20 20h10v10H20zM70 20h10v10H70zM20 70h10v10H20z" fill="#ffffff"/>
            <rect x="50" y="50" width="15" height="15" fill="#2563eb"/>
            <rect x="75" y="75" width="15" height="15" fill="#2563eb"/>
            <rect x="50" y="75" width="15" height="15" fill="#2563eb"/>
          </svg>
        </div>
        <p class="file-help">Código de demostración. El QR real se generará al conectar el servicio.</p>
      </div>
    `, true);
  },
};

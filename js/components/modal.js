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
    const texto = String(mensaje);

    aviso.textContent = texto;
    aviso.classList.remove("hidden");
    window.dispatchEvent(new CustomEvent("mediqr:aviso", { detail: { mensaje: texto } }));

    clearTimeout(this.temporizadorAviso);

    this.temporizadorAviso = setTimeout(() => {
      aviso.classList.add("hidden");
    }, 4000);
  },

  // Aviso para un cambio que solo existe en este dispositivo.
  //
  // El portal no tiene servidor: todo lo que el paciente edita se queda en
  // la memoria de la pestana y se pierde al recargar. Decir solo
  // "Informacion actualizada" hace pensar que hay una copia en algun
  // sitio; este anade siempre el matiz que falta.
  avisoLocal(mensaje) {
    this.aviso(mensaje + " Solo en este dispositivo: no se sincroniza con ningún servidor y se pierde al recargar.");
  },

  // El QR de emergencia se muestra desde Inicio y desde Perfil, asi que
  // vive en el componente de ventana y no en una vista concreta.
  //
  // Antes aqui se dibujaba un SVG con aspecto de codigo QR. No lo es: no
  // contiene ningun dato ni se puede escanear. En una emergencia, un
  // personal sanitario podria intentar escanearlo y perder tiempo
  // esperando algo que nunca va a llegar. Se sustituye por un estado
  // pendiente, sin patron que parezca escaneable.
  verQr() {
    this.modal("Código QR de emergencia", `
      <div class="card pending-card" role="note">
        <p class="pending-head">
          <i data-icon="qrcode"></i> Código QR en desarrollo
        </p>
        <p>El código QR de emergencia todavía no existe: necesita un servicio
           que lo genere y que valide a quién pertenece.</p>
        <p class="text-muted">No se muestra un patrón de ejemplo porque
           podría escanearse por error creyendo que es una credencial
           válida. Mientras tanto, lleva contigo tu documento de identidad
           y muéstralo en la tarjeta de emergencia.</p>
      </div>
    `, true);
  },
};

// ==========================================================
// MediQR · Control de cambios sin guardar
//
// Cancelar un formulario no deberia perder lo escrito sin avisar. Se
// toma una foto de los campos al abrir el formulario y, si al cancelar
// ya no coinciden, se pregunta antes de descartar.
// ==========================================================
window.MediFormularios = {
  // foto de los valores actuales del formulario
  _foto(formulario) {
    const campos = formulario.querySelectorAll("input, textarea, select");
    return Array.prototype.map.call(campos, (c) => c.value).join("|");
  },

  // Los listeners se enchufan una sola vez y leen siempre la foto actual.
  // Guardar la referencia permite desconectar el anterior: si se dejara el
  // viejo en pie, seguiria comparando contra su propia instantánea y podria
  // dejar el formulario como limpio con cambios escritos.
  marcar(formulario) {
    if (!formulario) return;

    if (formulario._revisar) {
      formulario.removeEventListener("input", formulario._revisar);
      formulario.removeEventListener("change", formulario._revisar);
    }

    const revisar = () => {
      formulario.dataset.estado =
        this._foto(formulario) === formulario.dataset.original ? "" : "sucio";
    };

    formulario._revisar = revisar;
    formulario.dataset.original = this._foto(formulario);
    formulario.dataset.estado = "";
    formulario.dataset.seguido = "1";

    formulario.addEventListener("input", revisar);
    // Un <select> no siempre emite input; change lo cubre siempre.
    formulario.addEventListener("change", revisar);
  },

  // No se guarda un booleano "sucio": se compara siempre contra la foto.
  // Un flag puede quedarse viejo si el evento no llega (por ejemplo, al
  // cambiar un valor por script) y entonces se descartaria algo escrito sin
  // preguntar. Comparar en el momento no puede desincronizarse.
  hayCambios(formulario) {
    if (!formulario || !formulario.dataset.original) return false;
    return this._foto(formulario) !== formulario.dataset.original;
  },

  // A cancelar: devuelve true si se puede descartar.
  confirmarDescarte(formulario, mensaje) {
    if (!this.hayCambios(formulario)) {
      if (formulario) formulario.dataset.estado = "";
      return true;
    }

    const aceptado = window.confirm(
      mensaje || "Tienes cambios sin guardar. Si sales ahora, se perderán."
    );

    // Si el paciente decide conservarlos, el formulario sigue abierto.
    formulario.dataset.estado = aceptado ? "" : "sucio";
    return aceptado;
  },
};

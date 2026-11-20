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

  // La vista de QR usa el servicio autenticado y no debe mostrar un codigo
  // local o simulado.
  verQr() {
    Router.ir("qr");
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

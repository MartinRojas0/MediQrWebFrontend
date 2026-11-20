(function () {
  "use strict";

  let issuedToken = null;
  let imageUrl = null;
  let activeQr = false;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function esDemo() {
    return Boolean(window.AccesoModulo && window.AccesoModulo.sesion &&
      window.AccesoModulo.sesion.esDemo);
  }

  function clearImage() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = null;
    const image = document.getElementById("qr-image");
    const download = document.getElementById("qr-download");
    if (image) image.removeAttribute("src");
    if (download) download.removeAttribute("href");
  }

  function limpiarSesion() {
    issuedToken = null;
    activeQr = false;
    clearImage();
    const result = document.getElementById("qr-result");
    if (result) result.classList.add("hidden");
    const link = document.getElementById("qr-public-link");
    if (link) {
      link.removeAttribute("href");
      link.textContent = "";
    }
  }

  function showError(id, message) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = message || "";
    element.classList.toggle("hidden", !message);
  }

  function setBusy(busy) {
    document.querySelectorAll("[data-qr-action]").forEach((button) => {
      button.disabled = busy || (button.dataset.action === "qr:revoke" && !activeQr);
    });
  }

  function render() {
    const destination = document.getElementById("view-qr");
    if (!destination) return;
    const demo = esDemo();

    destination.innerHTML = `
      <h1 class="heading-1" data-titulo-vista>Identidad médica digital</h1>
      <p class="view-lead">Genera y administra tu QR de emergencia desde aquí. El código no contiene información médica.</p>
      ${demo ? `<div class="card pending-card" role="note">
        <p class="pending-head">Vista aislada de demostración</p>
        <p>La ficha siguiente es ficticia. No se crea un QR escaneable ni se envían datos al servidor.</p>
      </div>` : ""}
      <section class="card qr-panel" aria-label="Paciente">
        <p class="identity-label">Paciente</p>
        <p class="identity-name">${esc([
          window.MediModules && window.MediModules.paciente && window.MediModules.paciente.nombre,
          window.MediModules && window.MediModules.paciente && window.MediModules.paciente.apellidos
        ].filter(Boolean).join(" ") || "Perfil del paciente")}</p>
      </section>
      <section class="card qr-panel" aria-labelledby="qr-options-title">
        <h2 class="section-title" id="qr-options-title">Información visible al escanear</h2>
        <p>Selecciona los campos que quieres compartir. El documento, la fecha de nacimiento, la dirección y el contacto de emergencia nunca se publican en esta ficha.</p>
        <div class="qr-options">
          <label><input id="qr-blood" type="checkbox"> Grupo sanguíneo</label>
          <label><input id="qr-allergies" type="checkbox"> Alergias</label>
          <label><input id="qr-conditions" type="checkbox"> Enfermedades crónicas</label>
          <label><input id="qr-medicines" type="checkbox"> Medicamentos activos (nombre y dosis)</label>
        </div>
        <p id="qr-status" class="qr-status" role="status">Comprobando el estado del QR…</p>
        <p id="qr-error" class="error-msg hidden" role="alert"></p>
        <div class="module-actions qr-actions">
          <button type="button" class="btn btn-primary" data-action="qr:issue" data-qr-action>
            ${demo ? "Mostrar ficha de muestra" : "Generar o renovar QR"}
          </button>
          <button type="button" class="btn btn-outline" data-action="qr:revoke" data-qr-action disabled>
            ${demo ? "Cerrar vista previa" : "Revocar QR activo"}
          </button>
        </div>
        <p class="file-help">${demo
          ? "La vista previa solo muestra los campos seleccionados y se borra al salir."
          : "Generar otro código revoca el anterior. Los QR duran 30 días. Guarda la imagen antes de salir; el token solo se entrega una vez."}</p>
      </section>
      ${demo ? `
        <section id="qr-result" class="card qr-result hidden" aria-live="polite">
          <h2 class="section-title">Ficha de emergencia ficticia</h2>
          <p>Vista previa ilustrativa: no es un QR real ni una ficha pública.</p>
          <div id="qr-demo-fields"></div>
          <p class="qr-privacy-note">Documento, fecha de nacimiento, dirección y contacto de emergencia no se incluyen.</p>
          <button id="qr-image-retry" type="button" class="btn btn-outline"
                  data-action="qr:image" data-qr-action>Actualizar vista previa</button>
        </section>` : `
        <section id="qr-result" class="card qr-result hidden" aria-live="polite">
          <h2 class="section-title">Código listo para usar</h2>
          <img id="qr-image" class="qr-image" alt="Código QR de emergencia">
          <p><a id="qr-public-link" rel="noopener noreferrer"></a></p>
          <a id="qr-download" class="btn btn-outline" download="mediqr-emergencia.png">Descargar QR PNG</a>
          <button id="qr-image-retry" type="button" class="btn btn-outline hidden"
                  data-action="qr:image" data-qr-action>Volver a generar la imagen</button>
        </section>`}`;

    clearImage();
    issuedToken = null;
    loadStatus();
  }

  async function loadStatus() {
    const status = document.getElementById("qr-status");
    const revokeButton = document.querySelector('[data-action="qr:revoke"]');
    if (esDemo()) {
      activeQr = false;
      if (status) status.textContent = "Demo: todavía no se muestra la ficha de ejemplo.";
      if (revokeButton) revokeButton.disabled = true;
      return;
    }
    if (!status || !window.MediApi || !window.MediApi.storage.getToken()) {
      if (status) status.textContent = "Inicia sesión como paciente para gestionar tu QR.";
      return;
    }

    try {
      const current = await window.MediApi.qr.getMe();
      if (!document.getElementById("qr-status")) return;
      const expiresAt = current && current.expiresAt;
      const isActive = Boolean(current && current.activo);
      activeQr = isActive;
      status.textContent = isActive
        ? "Hay un QR activo" + (expiresAt ? " hasta " + new Date(expiresAt).toLocaleString() + "." : ".")
        : "No hay un QR activo.";
      if (revokeButton) revokeButton.disabled = !isActive;
    } catch (error) {
      activeQr = false;
      if (revokeButton) revokeButton.disabled = true;
      status.textContent = "No se pudo consultar el QR. " + (error.message || "Inténtalo nuevamente.");
    }
  }

  function renderDemoPreview() {
    const result = document.getElementById("qr-result");
    const fields = document.getElementById("qr-demo-fields");
    const status = document.getElementById("qr-status");
    const revokeButton = document.querySelector('[data-action="qr:revoke"]');
    const paciente = window.MediModules && window.MediModules.paciente || {};
    const salud = window.MediModules && window.MediModules.salud || {};
    const alergias = (salud.alergias || []).map((item) =>
      typeof item === "string" ? item : item.nombre
    ).filter(Boolean).join(", ");
    const condiciones = (salud.condicionesCronicas || []).map((item) =>
      typeof item === "string" ? item : item.nombre
    ).filter(Boolean).join(", ");
    const medicamentos = (salud.medicamentosActuales || []).map((item) =>
      [item.nombre, item.dosis].filter(Boolean).join(" ")
    ).filter(Boolean).join(", ");
    const rows = [
      [document.getElementById("qr-blood")?.checked, "Grupo sanguíneo", salud.tipoSangre],
      [document.getElementById("qr-allergies")?.checked, "Alergias", alergias],
      [document.getElementById("qr-conditions")?.checked, "Enfermedades crónicas", condiciones],
      [document.getElementById("qr-medicines")?.checked, "Medicamentos", medicamentos]
    ].filter(([selected, _label, value]) => selected && value);

    if (fields) {
      fields.innerHTML = `
        <p><strong>Paciente ficticio:</strong> ${esc([paciente.nombre, paciente.apellidos].filter(Boolean).join(" ") || "Perfil de muestra")}</p>
        ${rows.length ? `<dl class="qr-medical-list">${rows.map(([_, label, value]) =>
          `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>`
          : "<p>No se seleccionaron datos médicos para esta vista previa.</p>"}`;
    }
    if (result) result.classList.remove("hidden");
    if (status) status.textContent = "Vista previa ficticia; no hay un QR activo.";
    activeQr = true;
    if (revokeButton) revokeButton.disabled = false;
  }

  async function issue() {
    if (esDemo()) {
      showError("qr-error", "");
      renderDemoPreview();
      return;
    }
    if (!window.MediApi || !window.MediApi.storage.getToken()) {
      showError("qr-error", "Inicia sesión con una cuenta paciente para continuar.");
      return;
    }
    clearImage();
    issuedToken = null;
    const result = document.getElementById("qr-result");
    if (result) result.classList.add("hidden");
    showError("qr-error", "");
    setBusy(true);
    try {
      const issued = await window.MediApi.qr.issue({
        mostrarTipoSangre: document.getElementById("qr-blood").checked,
        mostrarAlergias: document.getElementById("qr-allergies").checked,
        mostrarEnfermedades: document.getElementById("qr-conditions").checked,
        mostrarMedicamentos: document.getElementById("qr-medicines").checked
      });
      issuedToken = issued.token;
      activeQr = true;
      const link = document.getElementById("qr-public-link");
      if (link) {
        link.href = issued.publicUrl;
        link.textContent = "Abrir ficha pública";
      }
      const result = document.getElementById("qr-result");
      if (result) result.classList.remove("hidden");
      try {
        await generateImage();
      } catch (error) {
        showError("qr-error", error.message || "El QR se creó, pero no se pudo generar la imagen.");
        const retry = document.getElementById("qr-image-retry");
        if (retry) retry.classList.remove("hidden");
      }
      await loadStatus();
    } catch (error) {
      showError("qr-error", error.message || "No se pudo generar el QR.");
      await loadStatus();
    } finally {
      setBusy(false);
    }
  }

  async function generateImage() {
    if (!issuedToken) {
      showError("qr-error", "Genera un nuevo QR para volver a descargar su imagen.");
      return;
    }
    const blob = await window.MediApi.qr.image(issuedToken);
    clearImage();
    imageUrl = URL.createObjectURL(blob);
    const image = document.getElementById("qr-image");
    const download = document.getElementById("qr-download");
    const result = document.getElementById("qr-result");
    const retry = document.getElementById("qr-image-retry");
    if (image) image.src = imageUrl;
    if (download) download.href = imageUrl;
    if (result) result.classList.remove("hidden");
    if (retry) retry.classList.add("hidden");
    showError("qr-error", "");
  }

  async function retryImage() {
    if (esDemo()) {
      renderDemoPreview();
      return;
    }
    setBusy(true);
    try {
      await generateImage();
    } catch (error) {
      showError("qr-error", error.message || "No se pudo generar la imagen.");
      const retry = document.getElementById("qr-image-retry");
      if (retry) retry.classList.remove("hidden");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (esDemo()) {
      const result = document.getElementById("qr-result");
      const status = document.getElementById("qr-status");
      if (result) result.classList.add("hidden");
      activeQr = false;
      if (status) status.textContent = "Vista previa cerrada; no había un QR real que revocar.";
      setBusy(false);
      return;
    }
    if (!window.MediApi || !window.MediApi.storage.getToken()) return;
    showError("qr-error", "");
    setBusy(true);
    try {
      await window.MediApi.qr.revoke();
      issuedToken = null;
      activeQr = false;
      clearImage();
      const result = document.getElementById("qr-result");
      if (result) result.classList.add("hidden");
      const status = document.getElementById("qr-status");
      if (status) status.textContent = "QR revocado. La ficha ya no se puede abrir.";
      await loadStatus();
    } catch (error) {
      showError("qr-error", error.message || "No se pudo revocar el QR.");
    } finally {
      setBusy(false);
    }
  }

  function renderPublicState(destination, title, message) {
    destination.innerHTML = `
      <article class="card qr-public-card" role="status">
        <p class="qr-eyebrow">MediQR · Emergencia</p>
        <h1 class="heading-1">${esc(title)}</h1>
        <p>${esc(message)}</p>
      </article>`;
  }

  async function renderPublica(token) {
    const destination = document.getElementById("view-ficha");
    if (!destination) return;
    document.body.classList.add("solo-ficha");
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      renderPublicState(destination, "QR inválido", "Este código no es válido.");
      return;
    }

    destination.innerHTML = `
      <article class="card qr-public-card" aria-live="polite">
        <p class="qr-eyebrow">MediQR · Emergencia</p>
        <h1 class="heading-1">Cargando ficha segura…</h1>
        <p>El token se valida con el servidor y no incluye datos médicos.</p>
      </article>`;

    try {
      const data = await window.MediApi.qr.resolvePublic(token);
      const medicalRows = [
        ["Grupo sanguíneo", data.tipoSangre],
        ["Alergias", data.alergias],
        ["Enfermedades crónicas", data.enfermedadesCronicas]
      ].filter(([, value]) => value);
      const medicines = Array.isArray(data.medicamentos) ? data.medicamentos : [];
      destination.innerHTML = `
        <article class="card qr-public-card">
          <p class="qr-eyebrow">MediQR · Emergencia</p>
          <h1 class="heading-1">Ficha médica de emergencia</h1>
          ${data.informacionMedicaDisponible
            ? `<dl class="qr-medical-list">${medicalRows.map(([label, value]) =>
                `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>
              ${medicines.length
                ? `<section><h2>Medicamentos activos</h2><ul>${medicines.map((name) =>
                    `<li>${esc(name)}</li>`).join("")}</ul></section>`
                : ""}`
            : `<p class="qr-no-info">No hay información médica compartida en esta ficha.</p>`}
          <p class="qr-privacy-note">La ficha no muestra documento, fecha de nacimiento, domicilio ni contacto de emergencia.</p>
        </article>`;
    } catch (error) {
      const state = error.data && error.data.state;
      if (error.status === 410 && state === "revoked") {
        renderPublicState(destination, "QR revocado", "El propietario desactivó este código.");
      } else if (error.status === 410 && state === "expired") {
        renderPublicState(destination, "QR vencido", "Este código superó su fecha de expiración.");
      } else if (error.status === 404) {
        renderPublicState(destination, "QR inválido", "Este código no existe o no es válido.");
      } else {
        renderPublicState(destination, "Ficha no disponible", "No se pudo validar el código con el servidor. Inténtalo nuevamente.");
      }
    }
  }

  MediAcciones.definirVarias({
    "qr:issue": issue,
    "qr:image": retryImage,
    "qr:revoke": revoke
  });

  window.QrModulo = { render: render, renderPublica: renderPublica, limpiarSesion: limpiarSesion };
})();

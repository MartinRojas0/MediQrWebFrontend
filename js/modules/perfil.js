// ==========================================================
// MediQR · Vista Perfil
//
// Marcado del perfil del paciente y su logica: pestanas, edicion en
// modo lectura/escritura de los datos personales y medicos, y los
// modales de la seccion.
//
// El marcado es estatico. La edicion actua sobre los identificadores
// val-name, val-lastname, val-dni, val-birth, val-email, val-phone,
// val-blood, val-allergies, val-conditions y val-notes.
// ==========================================================
(function () {
  "use strict";

  var MARCADO = `      <h2>Perfil del Paciente</h2>

      <div class="profile-layout mt-1">

        <!-- BARRA LATERAL DEL PERFIL -->
        <aside class="profile-sidebar">
          <div class="avatar-box">
            <!-- Avatar local: no se solicita a servicios de terceros -->
            <img src="img/avatar.png" alt="Foto de perfil del paciente" class="avatar-img">
            <h3>Paciente Demo</h3>
            <p class="text-muted"><small>DNI: 00000000</small></p>
          </div>
          <nav class="sidebar-nav mt-1">
            <button class="sb-btn active"  data-action="perfil:pestana" data-tab="info-personal"><i data-icon="user"></i> Información Personal</button>
            <button class="sb-btn"  data-action="perfil:pestana" data-tab="info-medica"><i data-icon="heart-pulse"></i> Información Médica</button>
            <button class="sb-btn"  data-action="perfil:pestana" data-tab="contactos"><i data-icon="phone"></i> Contactos de Emergencia</button>
            <button class="sb-btn"  data-action="perfil:pestana" data-tab="configuracion"><i data-icon="gear"></i> Configuración</button>
          </nav>
        </aside>

        <!-- PANEL DE CONTENIDOS DE PERFIL -->
        <main class="profile-main">

          <!-- 8. INFORMACIÓN PERSONAL -->
          <article id="ptab-info-personal" class="card card-full profile-tab-content">
            <div class="card-header">
              <h3><i data-icon="user"></i> Información Personal</h3>
              <button class="btn btn-outline-sm" id="btn-edit-personal"  data-action="perfil:editar-personal">Editar</button>
            </div>

            <!-- Vista Lectura -->
            <div id="personal-read-view" class="data-grid">
              <p><strong>Nombres:</strong> <span id="val-name">Paciente</span></p>
              <p><strong>Apellidos:</strong> <span id="val-lastname">Demo</span></p>
              <p><strong>DNI:</strong> <span id="val-dni">00000000</span></p>
              <p><strong>Fecha de Nacimiento:</strong> <span id="val-birth">1990-01-01</span></p>
              <p><strong>Correo electrónico:</strong> <span id="val-email">paciente.demo@ejemplo.invalid</span></p>
              <p><strong>Teléfono:</strong> <span id="val-phone">+51 000 000 000</span></p>
            </div>

            <!-- Formulario Edición (Convertible visualmente) -->
            <form id="personal-edit-form" class="form-grid hidden"  data-action="perfil:guardar-personal">
              <label>Nombres: <input type="text" id="inp-name" value="Paciente" required></label>
              <label>Apellidos: <input type="text" id="inp-lastname" value="Demo" required></label>
              <label>DNI: <input type="text" id="inp-dni" value="00000000" required></label>
              <label>Fecha Nacimiento: <input type="date" id="inp-birth" value="1990-01-01" required></label>
              <label>Correo: <input type="email" id="inp-email" value="paciente.demo@ejemplo.invalid" required></label>
              <label>Teléfono: <input type="text" id="inp-phone" value="+51 000 000 000" required></label>
              <div class="form-actions mt-1" style="grid-column: span 2;">
                <button type="submit" class="btn btn-primary">Guardar</button>
                <button type="button" class="btn btn-outline"  data-action="perfil:cancelar-personal">Cancelar</button>
              </div>
            </form>
          </article>

          <!-- 9. INFORMACIÓN MÉDICA -->
          <article id="ptab-info-medica" class="card card-full profile-tab-content hidden">
            <div class="card-header">
              <h3><i data-icon="heart-pulse"></i> Información Médica</h3>
              <button class="btn btn-outline-sm" id="btn-edit-medical"  data-action="perfil:editar-medica">Editar</button>
            </div>

            <div id="medical-read-view" class="data-grid">
              <p><strong>Grupo Sanguíneo:</strong> <span id="val-blood">O+</span></p>
              <p><strong>Alergias:</strong> <span id="val-allergies">Penicilina, Aspirina</span></p>
              <p><strong>Condiciones Médicas:</strong> <span id="val-conditions">Hipertensión leve</span></p>
              <p><strong>Información Relevante:</strong> <span id="val-notes">Chequeo cardiológico anual recomendado.</span></p>
            </div>

            <form id="medical-edit-form" class="form-grid hidden"  data-action="perfil:guardar-medica">
              <label>Grupo Sanguíneo: <input type="text" id="inp-blood" value="O+" required></label>
              <label>Alergias: <input type="text" id="inp-allergies" value="Penicilina, Aspirina"></label>
              <label>Condiciones: <input type="text" id="inp-conditions" value="Hipertensión leve"></label>
              <label>Información Relevante: <input type="text" id="inp-notes" value="Chequeo cardiológico anual recomendado."></label>
              <div class="form-actions mt-1" style="grid-column: span 2;">
                <button type="submit" class="btn btn-primary">Guardar</button>
                <button type="button" class="btn btn-outline"  data-action="perfil:cancelar-medica">Cancelar</button>
              </div>
            </form>
          </article>

          <!-- 10. CONTACTOS DE EMERGENCIA -->
          <article id="ptab-contactos" class="card card-full profile-tab-content hidden">
            <div class="card-header">
              <h3><i data-icon="phone"></i> Contactos de Emergencia</h3>
              <button class="btn btn-primary-sm"  data-action="perfil:agregar-contacto">+ Agregar contacto</button>
            </div>

            <div class="contacts-grid mt-1">
              <div class="contact-card">
                <h4>Contacto Demo</h4>
                <p><strong>Parentesco:</strong> Hermana</p>
                <p><strong>Teléfono:</strong> +51 000 000 001</p>
                <div class="contact-actions mt-1">
                  <button class="btn btn-outline-sm"  data-action="perfil:agregar-contacto">Editar</button>
                  <button class="btn btn-danger-sm"  data-action="perfil:eliminar-contacto">Eliminar</button>
                </div>
              </div>
            </div>
          </article>

          <!-- 11. CONFIGURACIÓN -->
          <article id="ptab-configuracion" class="card card-full profile-tab-content hidden">
            <h3><i data-icon="bell"></i> Notificaciones</h3>
            <div class="settings-list mt-1">
              <div class="setting-item">
                <span>Recordatorios de medicamentos</span>
                <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
              </div>
              <div class="setting-item">
                <span>Recordatorios de citas</span>
                <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
              </div>
              <div class="setting-item">
                <span>Avisos importantes</span>
                <label class="switch"><input type="checkbox"><span class="slider"></span></label>
              </div>
            </div>

            <h3 class="mt-2"><i data-icon="sliders"></i> Preferencias Generales</h3>
            <p class="text-muted"><small>Preferencias de la aplicación (Idioma: Español / Modo Claro).</small></p>

            <h3 class="mt-2"><i data-icon="shield-halved"></i> Seguridad</h3>
            <div class="security-actions mt-1">
              <button class="btn btn-outline"  data-action="perfil:cambiar-password"><i data-icon="key"></i> Cambiar contraseña</button>
              <button class="btn btn-danger"  data-action="perfil:cerrar-sesion"><i data-icon="right-from-bracket"></i> Cerrar sesión</button>
            </div>
          </article>

        </main>
      </div>`;

  function render() {
    var destino = document.getElementById("view-perfil");

    if (destino && !destino.dataset.renderizado) {
      destino.innerHTML = MARCADO;
      destino.dataset.renderizado = "1";
    }
  }

  // 2. Navegación por pestañas del Perfil
  function switchProfileTab(tabId, btn) {
    document.querySelectorAll('.profile-tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.sb-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('ptab-' + tabId).classList.remove('hidden');
    btn.classList.add('active');
  }
  // 3. Edición visual de Información Personal
  function enablePersonalEdit() {
    document.getElementById('personal-read-view').classList.add('hidden');
    document.getElementById('personal-edit-form').classList.remove('hidden');
    document.getElementById('btn-edit-personal').classList.add('hidden');
  }
  function cancelPersonalEdit() {
    document.getElementById('personal-read-view').classList.remove('hidden');
    document.getElementById('personal-edit-form').classList.add('hidden');
    document.getElementById('btn-edit-personal').classList.remove('hidden');
  }
  function savePersonalEdit(e) {
    e.preventDefault();
    document.getElementById('val-name').textContent = document.getElementById('inp-name').value;
    document.getElementById('val-lastname').textContent = document.getElementById('inp-lastname').value;
    document.getElementById('val-dni').textContent = document.getElementById('inp-dni').value;
    document.getElementById('val-birth').textContent = document.getElementById('inp-birth').value;
    document.getElementById('val-email').textContent = document.getElementById('inp-email').value;
    document.getElementById('val-phone').textContent = document.getElementById('inp-phone').value;
    alert('¡Información personal actualizada visualmente!');
    cancelPersonalEdit();
  }
  // 4. Edición visual de Información Médica
  function enableMedicalEdit() {
    document.getElementById('medical-read-view').classList.add('hidden');
    document.getElementById('medical-edit-form').classList.remove('hidden');
    document.getElementById('btn-edit-medical').classList.add('hidden');
  }
  function cancelMedicalEdit() {
    document.getElementById('medical-read-view').classList.remove('hidden');
    document.getElementById('medical-edit-form').classList.add('hidden');
    document.getElementById('btn-edit-medical').classList.remove('hidden');
  }
  function saveMedicalEdit(e) {
    e.preventDefault();
    document.getElementById('val-blood').textContent = document.getElementById('inp-blood').value;
    document.getElementById('val-allergies').textContent = document.getElementById('inp-allergies').value;
    document.getElementById('val-conditions').textContent = document.getElementById('inp-conditions').value;
    document.getElementById('val-notes').textContent = document.getElementById('inp-notes').value;
    alert('¡Información médica actualizada visualmente!');
    cancelMedicalEdit();
  }
  // 5. Modales de Perfil
  // Todos usan el <dialog> nativo a traves de MediModules.modal(),
  // que aporta foco atrapado, cierre con Escape y ::backdrop.
  var PerfilModales = {
    verQr() {
      MediModules.modal('Código QR de Emergencia', `
        <div class="text-center">
          <svg width="180" height="180" viewBox="0 0 100 100" role="img" aria-label="Código QR de emergencia de demostración" style="background:#fff; padding:8px; border-radius:8px; border:1px solid #e2e8f0;">
            <rect width="100" height="100" fill="#ffffff"/>
            <path d="M10 10h30v30H10zM60 10h30v30H60zM10 60h30v30H10z" fill="#0284c7"/>
            <path d="M20 20h10v10H20zM70 20h10v10H70zM20 70h10v10H20z" fill="#ffffff"/>
            <rect x="50" y="50" width="15" height="15" fill="#0284c7"/>
            <rect x="75" y="75" width="15" height="15" fill="#0284c7"/>
            <rect x="50" y="75" width="15" height="15" fill="#0284c7"/>
          </svg>
        </div>
      `, true);
    },
    agregarContacto() {
      MediModules.modal('Contacto de Emergencia', `
        <form id="contacto-form" class="module-form" novalidate data-action="perfil:guardar-contacto">
          <label class="wide">Nombre: <input name="nombre" type="text" placeholder="Ej. Juan Pérez" required></label>
          <label class="wide">Parentesco: <input name="parentesco" type="text" placeholder="Ej. Padre" required></label>
          <label class="wide">Teléfono: <input name="telefono" type="tel" placeholder="+51 900 000 000" required></label>
          <p id="contacto-error" class="error-msg wide" role="alert"></p>
          <div class="module-actions wide">
            <button type="submit" class="btn btn-primary">Guardar</button>
            <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cancelar</button>
          </div>
        </form>
      `);
        },
    eliminarContacto() {
      MediModules.modal('¿Deseas eliminar este contacto?', `
        <p class="text-muted"><small>Esta acción es una simulación visual.</small></p>
        <div class="module-actions">
          <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cancelar</button>
          <button type="button" class="btn btn-danger"  data-action="perfil:confirmar-eliminar">Eliminar</button>
        </div>
      `, true);
    },
    confirmarEliminar() {
      MediModules.close();
      MediModules.aviso('Contacto eliminado visualmente.');
    },
    cambiarPassword() {
      MediModules.modal('Cambiar contraseña', `
        <form id="password-form" class="module-form" novalidate  data-action="perfil:password">
          <label class="wide">Contraseña actual: <input type="password" id="pass-curr" autocomplete="current-password"></label>
          <label class="wide">Nueva contraseña: <input type="password" id="pass-new" autocomplete="new-password"></label>
          <label class="wide">Confirmar nueva contraseña: <input type="password" id="pass-conf" autocomplete="new-password"></label>
          <p id="pass-error" class="error-msg wide" role="alert"></p>
          <div class="module-actions wide">
            <button type="submit" class="btn btn-primary">Cambiar contraseña</button>
            <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cancelar</button>
          </div>
        </form>
      `);
    },
    cerrarSesion() {
      MediModules.modal('¿Deseas cerrar sesión?', `
        <p class="text-muted"><small>Saldrás de la demostración visual del portal.</small></p>
        <div class="module-actions">
          <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cancelar</button>
          <button type="button" class="btn btn-danger"  data-action="perfil:confirmar-cierre">Cerrar sesión</button>
        </div>
      `, true);
    },
    confirmarCierre() {
      MediModules.close();
      MediModules.aviso('Sesión cerrada visualmente.');
    }
  };
  // 6. Validación visual de Cambiar Contraseña (Punto 12)
  function handlePasswordChange(e) {
    e.preventDefault();
    const curr = document.getElementById('pass-curr').value;
    const newP = document.getElementById('pass-new').value;
    const confP = document.getElementById('pass-conf').value;
    const errBox = document.getElementById('pass-error');
    if (!curr || !newP || !confP) {
      errBox.textContent = "Campos vacíos: Todos los datos son obligatorios.";
      errBox.classList.remove('hidden');
      return;
    }
    if (newP.length < 6) {
      errBox.textContent = "Contraseña insuficiente: Debe tener al menos 6 caracteres.";
      errBox.classList.remove('hidden');
      return;
    }
    if (newP !== confP) {
      errBox.textContent = "Contraseñas diferentes: Las contraseñas no coinciden.";
      errBox.classList.remove('hidden');
      return;
    }
    errBox.classList.add('hidden');
    MediModules.close();
    MediModules.aviso('Contraseña actualizada visualmente con éxito.');
  }

  function iniciar() {
    render();
  }

  // Las funciones quedan privadas al modulo: el markup las invoca por
  // data-action y MediAcciones las conecta. No hay manejadores globales.
  MediAcciones.definirVarias({
    "perfil:pestana": function (el) { switchProfileTab(el.dataset.tab, el); },
    "perfil:editar-personal": function () { enablePersonalEdit(); },
    "perfil:cancelar-personal": function () { cancelPersonalEdit(); },
    "perfil:guardar-personal": function (el, evento) { savePersonalEdit(evento); },
    "perfil:editar-medica": function () { enableMedicalEdit(); },
    "perfil:cancelar-medica": function () { cancelMedicalEdit(); },
    "perfil:guardar-medica": function (el, evento) { saveMedicalEdit(evento); },
    "perfil:password": function (el, evento) { handlePasswordChange(evento); },
    "perfil:guardar-contacto": function () {
      MediModules.close();
      MediModules.aviso('Contacto guardado visualmente.');
    },
    "perfil:ver-qr": function () { PerfilModales.verQr(); },
    "perfil:agregar-contacto": function () { PerfilModales.agregarContacto(); },
    "perfil:eliminar-contacto": function () { PerfilModales.eliminarContacto(); },
    "perfil:confirmar-eliminar": function () { PerfilModales.confirmarEliminar(); },
    "perfil:cambiar-password": function () { PerfilModales.cambiarPassword(); },
    "perfil:cerrar-sesion": function () { PerfilModales.cerrarSesion(); },
    "perfil:confirmar-cierre": function () { PerfilModales.confirmarCierre(); }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();

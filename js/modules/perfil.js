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

  var MARCADO = `      <h1 data-titulo-vista class="heading-1">Perfil del paciente</h1>
      <p class="text-muted">Tus datos y la configuración del portal</p>

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
              <p><strong>Fecha de Nacimiento:</strong> <span id="val-birth" data-iso="1990-01-01">01/01/1990</span></p>
              <p><strong>Edad:</strong> <span id="val-age">35 años</span></p>
              <p><strong>Correo electrónico:</strong> <span id="val-email">paciente.demo@ejemplo.invalid</span></p>
              <p><strong>Teléfono:</strong> <span id="val-phone">+51 000 000 000</span></p>
              <p class="data-grid-full"><strong>Dirección:</strong> <span id="val-address">Sin registrar</span></p>
            </div>

            <!-- Formulario Edición (Convertible visualmente) -->
            <form id="personal-edit-form" class="form-grid hidden"  data-action="perfil:guardar-personal">
              <label>Nombres: <input type="text" id="inp-name" value="Paciente" required></label>
              <label>Apellidos: <input type="text" id="inp-lastname" value="Demo" required></label>
              <label>DNI: <input type="text" id="inp-dni" value="00000000" required></label>
              <label>Fecha Nacimiento: <input type="date" id="inp-birth" value="1990-01-01" required></label>
              <label>Correo: <input type="email" id="inp-email" value="paciente.demo@ejemplo.invalid" required></label>
              <label>Teléfono: <input type="text" id="inp-phone" value="+51 000 000 000" required></label>
              <label class="data-grid-full">Dirección:
                <input type="text" id="inp-street" value="" placeholder="Calle y número"
                       aria-describedby="address-error">
              </label>
              <label class="data-grid-full">Distrito:
                <input type="text" id="inp-district" value="" placeholder="Distrito">
              </label>
              <p id="address-error" class="error-msg" role="alert"></p>
              <p id="personal-error" class="error-msg data-grid-full" role="alert"></p>
              <div class="form-actions mt-1 data-grid-full">
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
              <div class="form-actions mt-1 data-grid-full">
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

<div id="contacts-grid" class="contacts-grid mt-1"></div>
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

            <h3 class="mt-2"><i data-icon="file-pdf"></i> Tu expediente</h3>
            <p class="text-muted"><small>Se genera en tu propio dispositivo, sin enviar nada a ningún servidor.</small></p>
            <div class="security-actions mt-1">
              <button class="btn btn-outline"  data-action="perfil:exportar"><i data-icon="file-pdf"></i> Exportar historial</button>
            </div>

            <h3 class="mt-2"><i data-icon="shield-halved"></i> Seguridad</h3>
            <div class="security-actions mt-1">
              <button class="btn btn-outline"  data-action="perfil:cambiar-password"><i data-icon="key"></i> Cambiar contraseña</button>
              <button class="btn btn-outline"  data-action="perfil:ir-acceso"><i data-icon="right-from-bracket"></i> Iniciar sesión</button>
              <button class="btn btn-danger"  data-action="perfil:cerrar-sesion"><i data-icon="right-from-bracket"></i> Cerrar sesión</button>
            </div>
            <p class="text-muted mt-1"><small>El acceso está pendiente de integración: todavía no hay servidor que verifique las credenciales.</small></p>
          </article>

        </main>
      </div>`;

  function render() {
    var destino = document.getElementById("view-perfil");

    if (destino && !destino.dataset.renderizado) {
      destino.innerHTML = MARCADO;
      destino.dataset.renderizado = "1";
      pintarContactos();
      pintarDerivados();
    }
  }

  // La lista de contactos se pinta desde los datos, no desde un bloque fijo
  // en el marcado: antes el boton de guardar no guardaba nada y solo
  // avisaba de que si.
  function pintarContactos() {
    const destino = document.getElementById('contacts-grid');
    if (!destino) return;

    const lista = MediModules.salud.contactos || [];

    if (lista.length === 0) {
      destino.innerHTML = '<div class="empty-state">'
        + '<i data-icon="phone"></i>'
        + '<p><strong>Sin contactos de emergencia</strong></p>'
        + '<p class="text-muted">Agrega a alguien a quien llamar si te ocurre algo.</p>'
        + '</div>';
      MediIcons.render(destino);
      return;
    }

    destino.innerHTML = lista.map(function (c) {
      return `
        <div class="contact-card">
          <h4>${MediPartes.dom.escapar(c.nombre)}</h4>
          <p><strong>Parentesco:</strong> ${MediPartes.dom.escapar(c.parentesco)}</p>
          <p><strong>Teléfono:</strong> ${MediPartes.dom.escapar(c.telefono)}</p>
          <div class="contact-actions mt-1">
            <a class="btn btn-outline-sm" href="tel:${MediPartes.dom.atributo(String(c.telefono).replace(/\D/g, ''))}">
              <i data-icon="phone"></i> Llamar
            </a>
            <button type="button" class="btn btn-danger-sm"  data-action="perfil:eliminar-contacto" data-id="${c.id}">Eliminar</button>
          </div>
        </div>`;
    }).join('');

    MediIcons.render(destino);
  }

  // La edad y la fecha de nacimiento no se escriben en el marcado: se derivan
  // de la fecha guardada. Escribirlas a mano las dejaba desactualizadas (un
  // "35 años" fijo que envejecia con el tiempo y ya no cuadraba).
  function pintarDerivados() {
    var nodo = document.getElementById('val-birth');
    var nacimiento = nodo.dataset.iso || '';
    var edad = MediPartes.fechas.edad(nacimiento);

    document.getElementById('val-age').textContent = edad === null
      ? 'Sin registrar'
      : edad + (edad === 1 ? ' año' : ' años');

    if (/^\d{4}-\d{2}-\d{2}$/.test(nacimiento)) {
      nodo.textContent = MediPartes.fechas.fechaCorta(nacimiento);
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
  // Al entrar en edicion el formulario se rellena con lo guardado. Sin esto,
  // cancelar y volver a editar resucita valores que el paciente ya habia
  // descartado en el intento anterior.
  function enablePersonalEdit() {
    const formulario = document.getElementById('personal-edit-form');
    document.getElementById('inp-name').value = document.getElementById('val-name').textContent;
    document.getElementById('inp-lastname').value = document.getElementById('val-lastname').textContent;
    document.getElementById('inp-dni').value = document.getElementById('val-dni').textContent;
    document.getElementById('inp-birth').value = document.getElementById('val-birth').dataset.iso || '';
    document.getElementById('inp-email').value = document.getElementById('val-email').textContent;
    document.getElementById('inp-phone').value = document.getElementById('val-phone').textContent;

    const direccion = document.getElementById('val-address').textContent;
    const esSinRegistrar = direccion === 'Sin registrar';
    const partes = esSinRegistrar ? ['', ''] : direccion.split(', ');
    document.getElementById('inp-street').value = partes[0] || '';
    document.getElementById('inp-district').value = partes[1] || '';

    document.getElementById('personal-read-view').classList.add('hidden');
    document.getElementById('personal-edit-form').classList.remove('hidden');
    document.getElementById('btn-edit-personal').classList.add('hidden');

    // La foto se toma al abrir, no al cargar la vista: si no, compararíamos
    // contra unos valores que el paciente ya habia cambiado.
    MediFormularios.marcar(formulario);
  }
  function cancelPersonalEdit() {
    // Si hay algo escrito que no se ha guardado, se pregunta antes de
    // tirarlo: entrar y salir sin querer no debe costar los datos.
    const formulario = document.getElementById('personal-edit-form');
    if (!MediFormularios.confirmarDescarte(formulario,
        'Tienes cambios en tus datos sin guardar. Si sales ahora, se perderán.')) {
      return;
    }
    document.getElementById('personal-read-view').classList.remove('hidden');
    document.getElementById('personal-edit-form').classList.add('hidden');
    document.getElementById('btn-edit-personal').classList.remove('hidden');
  }
  function savePersonalEdit(e) {
    e.preventDefault();

    const valores = {
      nombre: document.getElementById('inp-name').value,
      apellido: document.getElementById('inp-lastname').value,
      dni: document.getElementById('inp-dni').value,
      nacimiento: document.getElementById('inp-birth').value,
      email: document.getElementById('inp-email').value,
      telefono: document.getElementById('inp-phone').value,
      calle: document.getElementById('inp-street').value.trim(),
      distrito: document.getElementById('inp-district').value.trim()
    };

    // Reglas de utils/Validaciones.kt de la app movil. El telefono llega
    // con prefijo internacional: se comprueban los 9 digitos locales.
    const digitosLocales = valores.telefono.replace(/\D/g, '').slice(-9);

    const resultado = MediValidaciones.todo([
      function () { return MediValidaciones.nombre(valores.nombre); },
      function () { return MediValidaciones.nombre(valores.apellido); },
      function () { return MediValidaciones.dni(valores.dni); },
      function () { return MediValidaciones.nacimiento(valores.nacimiento); },
      function () { return MediValidaciones.email(valores.email); },
      function () { return MediValidaciones.telefono(digitosLocales); }
    ]);

    const error = document.getElementById('personal-error');

    if (!resultado.ok) {
      error.textContent = resultado.mensaje;
      error.classList.remove('hidden');
      return;
    }

    error.textContent = '';
    error.classList.add('hidden');

    document.getElementById('val-name').textContent = valores.nombre;
    document.getElementById('val-lastname').textContent = valores.apellido;
    document.getElementById('val-dni').textContent = valores.dni;

    // El ISO se guarda aparte; lo que se ve es la fecha del portal.
    document.getElementById('val-birth').dataset.iso = valores.nacimiento;
    pintarDerivados();

    document.getElementById('val-email').textContent = valores.email;
    document.getElementById('val-phone').textContent = valores.telefono;

    const direccion = [valores.calle, valores.distrito].filter(Boolean).join(', ');
    document.getElementById('val-address').textContent = direccion || 'Sin registrar';

    MediModules.avisoLocal('Información personal actualizada.');
    cancelPersonalEdit();
  }
  // 4. Edición visual de Información Médica
  function enableMedicalEdit() {
    const formulario = document.getElementById('medical-edit-form');
    document.getElementById('medical-read-view').classList.add('hidden');
    document.getElementById('medical-edit-form').classList.remove('hidden');
    document.getElementById('btn-edit-medical').classList.add('hidden');

    MediFormularios.marcar(formulario);
  }
  function cancelMedicalEdit() {
    const formulario = document.getElementById('medical-edit-form');
    if (!MediFormularios.confirmarDescarte(formulario,
        'Tienes cambios en tu información médica sin guardar. Si sales ahora, se perderán.')) {
      return;
    }
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
    MediModules.avisoLocal('Información médica actualizada.');
    cancelMedicalEdit();
  }

  // 6. Exportacion del expediente
  // Genera un HTML autonomo e imprimible, igual que
  // exportarExpedienteHTML() en la app movil. Todo ocurre en el navegador:
  // Blob + URL.createObjectURL, sin red ni servidor.
  function exportarExpediente() {
    const val = function (id, alt) {
      const nodo = document.getElementById(id);
      return nodo ? nodo.textContent : (alt || 'Sin registrar');
    };

    const esc = function (v) {
      return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    const ahora = new Date();
    const dosDig = function (n) { return String(n).padStart(2, '0'); };
    const sello = dosDig(ahora.getDate()) + '/' + dosDig(ahora.getMonth() + 1) + '/'
      + ahora.getFullYear() + ' ' + dosDig(ahora.getHours()) + ':' + dosDig(ahora.getMinutes());

    const nombreCompleto = (val('val-name', '') + ' ' + val('val-lastname', '')).trim();

    let html = '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">'
      + '<title>Expediente Medico MediQR</title><style>'
      + 'body{font-family:sans-serif;color:#333;padding:20px;line-height:1.5}'
      + '.header{text-align:center;border-bottom:2px solid #1E88E5;padding-bottom:10px;margin-bottom:20px}'
      + 'h1{color:#1E88E5;margin:0}'
      + '.header p{margin:4px 0 0;font-size:12px;color:#666}'
      + 'h2{color:#EF4444;border-left:4px solid #EF4444;padding-left:10px;margin-top:30px;font-size:18px}'
      + '.section{margin-bottom:20px}.field{font-weight:bold;color:#555}'
      + '.item{background:#F8FAFC;padding:15px;border-radius:8px;margin-bottom:10px;border:1px solid #E2E8F0}'
      + '</style></head><body>'
      + '<div class="header"><h1>EXPEDIENTE MEDICO MEDIQR</h1>'
      + '<p>Generado el ' + esc(sello) + '</p></div>'
      + '<h2>1. INFORMACION PERSONAL</h2><div class="section">'
      + '<p><span class="field">Nombre:</span> ' + esc(nombreCompleto) + '</p>'
      + '<p><span class="field">DNI:</span> ' + esc(val('val-dni')) + ' | <span class="field">Edad:</span> ' + esc(val('val-age')) + '</p>'
      + '<p><span class="field">Nacimiento:</span> ' + esc(val('val-birth')) + '</p>'
      + '<p><span class="field">Correo:</span> ' + esc(val('val-email')) + ' | <span class="field">Telefono:</span> ' + esc(val('val-phone')) + '</p>'
      + '<p><span class="field">Direccion:</span> ' + esc(val('val-address')) + '</p></div>'
      + '<h2>2. INFORMACION CLINICA</h2><div class="section">'
      + '<p><span class="field">Tipo de Sangre:</span> ' + esc(val('val-blood')) + '</p>'
      + '<p><span class="field">Alergias:</span> ' + esc(val('val-allergies')) + '</p>'
      + '<p><span class="field">Condiciones:</span> ' + esc(val('val-conditions')) + '</p>'
      + '<p><span class="field">Notas:</span> ' + esc(val('val-notes')) + '</p></div>'
      + '<h2>3. HISTORIAL DE CONSULTAS</h2><div class="section">';

    // Los datos viven en MediModules; MediPartes.citas es el modulo de Citas.
    const citas = (MediModules.citas || []).filter(function (c) {
      return String(c.estado).toLowerCase() === 'atendida';
    });

    if (!citas.length) {
      html += '<p class="item">Todavia no hay consultas atendidas registradas.</p>';
    } else {
      citas.forEach(function (c) {
        html += '<div class="item">'
          + '<p><span class="field">[' + esc(c.fecha) + '] ' + esc(c.especialidad) + '</span></p>'
          + '<p><span class="field">Medico:</span> ' + esc(c.medico) + ' | <span class="field">Lugar:</span> ' + esc(c.lugar) + '</p>'
          + '</div>';
      });
    }

    html += '</div></body></html>';

    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'expediente-mediqr.html';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    // Libera el Blob para no retener memoria tras la descarga.
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

    MediModules.aviso('Expediente generado en tu dispositivo. Abre el archivo e imprímelo o guárdalo como PDF.');
  }

  // 5. Modales de Perfil
  // Todos usan el <dialog> nativo a traves de MediModules.modal(),
  // que aporta foco atrapado, cierre con Escape y ::backdrop.
  var PerfilModales = {
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
    eliminarContacto(id) {
      const contacto = MediModules.salud.contactos.filter(function (c) {
        return c.id === id;
      })[0];

      if (!contacto) return;

      MediModules.modal('¿Deseas eliminar este contacto?', `
        <p><strong>${MediPartes.dom.escapar(contacto.nombre)}</strong> ·
           ${MediPartes.dom.escapar(contacto.parentesco)}</p>
        <p class="file-help">Se quitará de los contactos de emergencia de este
           dispositivo. No hay servidor al que avisar.</p>
        <div class="module-actions">
          <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cancelar</button>
          <button type="button" class="btn btn-danger"  data-action="perfil:confirmar-eliminar" data-id="${contacto.id}">Eliminar</button>
        </div>
      `, true);
    },
    confirmarEliminar(id) {
      // Se borra de verdad el contacto, no solo se avisa.
      const lista = MediModules.salud.contactos;
      const indice = lista.findIndex(function (c) { return c.id === id; });

      if (indice === -1) {
        MediModules.close();
        return;
      }

      lista.splice(indice, 1);
      pintarContactos();
      MediModules.close();
      MediModules.avisoLocal('Contacto eliminado.');
    },
    // Sin servidor de autenticacion, cambiar la contrasena aqui no cambiaria
    // nada: se guardaria en memoria y se perderia al recargar, dando la
    // impresion de que la cuenta esta protegida cuando no lo esta. Se
    // muestra el formulario con la accion desactivada y el motivo a la vista.
    cambiarPassword() {
      MediModules.modal('Cambiar contraseña', `
        <div class="card pending-card" role="note" id="password-pendiente">
          <p class="pending-head">
            <i data-icon="shield-halved"></i> Cambio de contraseña pendiente
          </p>
          <p>No hay servidor de autenticación conectado, así que aquí no se puede
             cambiar ninguna contraseña.</p>
          <p class="text-muted">Escribirla aquí solo daría la impresión de que la
             cuenta está protegida cuando no lo está.</p>
        </div>
        <form id="password-form" class="module-form" novalidate data-action="perfil:password">
          <label class="wide">Contraseña actual: <input type="password" id="pass-curr" autocomplete="current-password"></label>
          <label class="wide">Nueva contraseña: <input type="password" id="pass-new" autocomplete="new-password"></label>
          <label class="wide">Confirmar nueva contraseña: <input type="password" id="pass-conf" autocomplete="new-password"></label>
          <p id="pass-error" class="error-msg wide" role="alert"></p>
          <div class="module-actions wide">
            <button type="submit" class="btn btn-primary" disabled aria-describedby="password-pendiente">
              Cambiar contraseña
            </button>
            <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cerrar</button>
          </div>
        </form>
      `);
    },
    // No hay sesion que cerrar: el acceso no esta integrado. Se ofrece ir a
    // las pantallas de acceso, que es lo que el paciente buscaria.
    cerrarSesion() {
      MediModules.modal('Sesión de acceso', `
        <p class="text-muted">Todavía no hay una sesión iniciada: el acceso al
        portal aún no está integrado con un servidor.</p>
        <p class="file-help">Los datos que ves son de demostración y están
        disponibles sin ningún tipo de acceso.</p>
        <div class="module-actions">
          <button type="button" class="btn btn-primary"  data-action="perfil:ir-acceso">Ir a iniciar sesión</button>
          <button type="button" class="btn btn-outline"  data-action="modal:cerrar">Cerrar</button>
        </div>
      `, true);
    },
  };
  // El envio esta deshabilitado, pero si alguien lo fuerza por teclado el
  // formulario responde igual: explica el motivo y borra lo escrito para
  // que ninguna contrasena quede en el DOM.
  function handlePasswordChange(e) {
    e.preventDefault();

    const errBox = document.getElementById('pass-error');
    errBox.textContent =
      'El cambio de contraseña todavía no está disponible: falta conectar el servidor de autenticación.';
    errBox.classList.remove('hidden');

    ['pass-curr', 'pass-new', 'pass-conf'].forEach(function (id) {
      const campo = document.getElementById(id);
      if (campo) campo.value = '';
    });
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
    "perfil:exportar": function () { exportarExpediente(); },
    "perfil:ir-acceso": function () { Router.ir("acceso"); },
    "perfil:guardar-contacto": function (el, evento) {
      evento.preventDefault();

      const form = document.getElementById('contacto-form');
      const datos = new FormData(form);
      const nombre = String(datos.get('nombre') || '').trim();
      const parentesco = String(datos.get('parentesco') || '').trim();
      const telefono = String(datos.get('telefono') || '').trim();
      const error = document.getElementById('contacto-error');

      // Se validan los tres campos antes de guardar nada. Un error no
      // cierra el formulario ni borra lo escrito.
      const vacio = !nombre || !parentesco || !telefono;
      const telefonoCorto = telefono.replace(/\D/g, '').slice(-9);

      if (vacio) {
        error.textContent = 'Completa nombre, parentesco y teléfono.';
        return;
      }

      if (!MediValidaciones.telefono(telefonoCorto).ok) {
        error.textContent = 'El teléfono debe tener 9 dígitos.';
        return;
      }

      error.textContent = '';
      MediModules.salud.contactos.push({
        id: Date.now(),
        nombre: nombre,
        parentesco: parentesco,
        telefono: telefono
      });

      pintarContactos();
      MediModules.close();
      MediModules.avisoLocal('Contacto añadido a tus contactos de emergencia.');
    },
    
    "perfil:agregar-contacto": function () { PerfilModales.agregarContacto(); },
    "perfil:eliminar-contacto": function (el) { PerfilModales.eliminarContacto(Number(el.dataset.id)); },
    "perfil:confirmar-eliminar": function (el) { PerfilModales.confirmarEliminar(Number(el.dataset.id)); },
    "perfil:cambiar-password": function () { PerfilModales.cambiarPassword(); },
    "perfil:cerrar-sesion": function () { PerfilModales.cerrarSesion(); }
  });

  // Se expone para que la vista pueda repintarse cuando cambian los
  // contactos, igual que Salud expone refrescar().
  window.PerfilModulo = { pintarContactos };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();

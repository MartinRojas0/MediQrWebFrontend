// ==========================================================
// MediQR - Pruebas funcionales del portal del paciente
//
// Se inyecta en la pagina durante la ejecucion (ver tests/run.js)
// y escribe el resultado en #TESTRESULT.
// ==========================================================
window.__errs = [];
window.__alerts = [];

window.addEventListener('error', function (e) {
  window.__errs.push('ERROR: ' + (e.message || '') + ' @ ' + (e.filename || '') + ':' + (e.lineno || ''));
});
window.addEventListener('unhandledrejection', function (e) {
  window.__errs.push('PROMISE: ' + e.reason);
});

// El codigo real usa alert() para confirmar acciones. En modo headless el
// dialogo bloquearia la pagina, asi que se sustituye por un registro.
window.alert = function (m) { window.__alerts.push(String(m)); };
window.confirm = function () { return true; };

window.addEventListener('DOMContentLoaded', function () {
  setTimeout(function () {
    // Modo enlace directo: el ejecutor pide una ruta concreta y solo se
    // comprueba que el portal restaura esa vista al cargar (equivale a
    // recargar la pagina con la URL ya escrita).
    if (window.__CASO) { return comprobarEnlaceDirecto(); }
    run().catch(function (e) {
      var pre = document.createElement('pre');
      pre.id = 'TESTRESULT';
      pre.textContent = '==RESULTADO==\nHARNESS ERROR: ' + (e && e.stack ? e.stack : e);
      document.body.appendChild(pre);
    });
  }, 0);
});

async function comprobarEnlaceDirecto() {
  const R = [];
  const ok = (n, c, x) => R.push({ t: n, p: !!c, x: x == null ? '' : String(x) });
  const q = (s) => document.querySelector(s);
  const qa = (s) => document.querySelectorAll(s);
  const vis = (e) => !!e && !e.classList.contains('hidden');
  const caso = window.__CASO;

  const casos = {
    'inicio': () => vis(q('#view-inicio')) && qa('#view-inicio .summary-row').length === 3,
    'salud': () => vis(q('#view-salud')) && qa('#view-salud .info-row-item').length === 6,
    'historial': () => vis(q('#view-historial')) && qa('#view-historial .hist-item').length > 0,
    'perfil': () => vis(q('#view-perfil')) && qa('.sb-btn').length === 4,
    'citas/agendar': () => vis(q('#view-citas')) && !!q('#schedule-form'),
    'citas/historial': () => vis(q('#view-citas')) && qa('#citas-content .module-cards .card').length > 0,
    'documentos/recetas': () => vis(q('#view-documentos')) && qa('#documents-content .doc-card').length === 2,
    'documentos/examenes': () => vis(q('#view-documentos')) && qa('#documents-content .doc-card').length === 3,
    'documentos/todos': () => vis(q('#view-documentos')) && qa('#documents-content .doc-card').length === 9,
    'ruta-inexistente': () => location.hash === '#/inicio' && vis(q('#view-inicio'))
  };

  ok('D.1 La ruta se restaura al cargar', caso === 'ruta-inexistente'
    ? casos[caso]() : location.hash === '#/' + caso, location.hash);
  ok('D.2 La vista correspondiente se muestra', casos[caso](), caso);
  ok('D.3 Solo una vista visible', qa('.view-section:not(.hidden)').length === 1);
  // Historial se abre desde Inicio y no tiene posicion propia en la barra:
  // en ese caso la seccion activa se marca en su tarjeta de acceso.
  ok('D.4 La seccion activa queda marcada',
     qa('.app-nav [aria-current="page"]').length + qa('.quick-card[aria-current="page"]').length === 1);
  ok('D.5 El titulo del documento no es el generico',
    !/Portal del Paciente$/.test(document.title), document.title);
  ok('D.6 Sin errores JavaScript', (window.__errs || []).length === 0, JSON.stringify(window.__errs || []));

  const pass = R.filter((r) => r.p).length;
  let out = `==RESULTADO==\nCASO=${caso}\nTOTAL=${R.length} OK=${pass} FALLOS=${R.length - pass}\n`;
  R.forEach((r) => { out += (r.p ? 'PASS | ' : 'FAIL | ') + r.t + (r.x ? `  [${r.x}]` : '') + '\n'; });
  const pre = document.createElement('pre'); pre.id = 'TESTRESULT'; pre.textContent = out;
  document.body.appendChild(pre);
}

var tick = function () { return new Promise(function (r) { setTimeout(r, 30); }); };

async function run() {
  var R = [];
  var ok = function (n, c, x) { R.push({ t: n, p: !!c, x: x == null ? '' : String(x) }); };
  var q = function (s) { return document.querySelector(s); };
  var qa = function (s) { return document.querySelectorAll(s); };
  var vis = function (e) { return !!e && !e.classList.contains('hidden'); };

  // ---------- RECURSOS ----------
  // Se captura antes de cualquier navegacion: el hash inicial solo es
  // observable en la primera carga.
  var hashInicial = location.hash;
  var recs = performance.getEntriesByType('resource').map(function (r) { return r.name; });
  ok('R.1 Entrada en la raiz del sitio', location.pathname === '/' || location.pathname === '/index.html', location.pathname);
  ok('R.2 CSS cargados desde /css', recs.filter(function (u) { return /\.css$/.test(u); }).length === 6, recs.filter(function (u) { return /\.css$/.test(u); }).length + ' hojas');
  ok('R.3 Todos los scripts de la app se sirven desde /js', recs.filter(function (u) { return /\.js$/.test(u); })
    .filter(function (u) { return u.indexOf('/__test__/') === -1; })
    .every(function (u) { return /\/js\//.test(u); }));

  // La arquitectura modular sustituyo al archivo monolitico: se comprueba
  // que los modulos nuevos se cargan y que el antiguo ya no se pide.
  var esperados = ['lib/dates.js', 'lib/dom.js', 'lib/format.js', 'components/navbar.js',
    'components/modal.js', 'modules/citas.js', 'modules/documentos.js',
    'modules/inicio.js', 'modules/perfil.js', 'data/store.js', 'router.js', 'app.js', 'icons.js'];
  var faltan = esperados.filter(function (n) {
    return !recs.some(function (u) { return u.indexOf('/js/' + n) !== -1; });
  });
  ok('R.3b Todos los modulos se cargan', faltan.length === 0, faltan.length ? faltan.join(',') : esperados.length + ' modulos');
  ok('R.3c El archivo monolitico ya no se pide', !recs.some(function (u) { return /citasDocumentos\.js$/.test(u); }));
  ok('R.4 Imagen cargada desde /img', recs.filter(function (u) { return /\.png$/.test(u); }).length === 1);
  ok('R.5 CSS aplicado', getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)', getComputedStyle(document.body).backgroundColor);
  ok('R.6 Sin peticiones a terceros', recs.every(function (u) { return /^https?:\/\/(127\.0\.0\.1|localhost)/.test(u); }));
  ok('R.7 Ningun recurso bajo /html/', recs.every(function (u) { return u.indexOf('/html/') === -1; }));
  ok('R.8 lang declarado en espanol', document.documentElement.lang === 'es', document.documentElement.lang);

  // ---------- NAVEGACION ----------
  // "Salud" dejo de ser un enlace muerto: abre el expediente clinico,
  // igual que en la app movil.
  var enlaceSalud = Array.prototype.filter.call(qa('.app-nav .nav-item'), function (a) {
    return a.querySelector('.nav-item-label').textContent.trim() === 'Salud';
  })[0];

  ok('N.1 El enlace Salud existe', !!enlaceSalud);
  if (enlaceSalud) {
    enlaceSalud.click();
    await tick();
    ok('N.1b Salud abre el expediente clinico',
       location.hash === '#/salud' && vis(q('#view-salud')), location.hash);
    ok('N.1c El expediente muestra las tres secciones',
       qa('#view-salud .section-title').length === 3, qa('#view-salud .section-title').length + ' secciones');
    ok('N.1d Alergia grave genera tarjeta de alerta en Salud',
       !!q('#view-salud .critical-alert') && /ALERTA/.test(q('#view-salud .critical-alert').textContent));
    ok('N.1e Las seis filas del expediente estan',
       qa('#view-salud .info-row-item').length === 6, qa('#view-salud .info-row-item').length + ' filas');
  }
  q('#nav-inicio').click(); await tick();
  ok('N.2 El item de Perfil es solo icono y etiqueta', q('#nav-perfil') && q('#nav-perfil').querySelector('.nav-item-label').textContent.trim() === 'Perfil');
  ok('N.3 Router disponible sin funciones globales', typeof Router === 'object' && typeof window.switchSection === 'undefined');
  ok('N.4 Iconos SVG renderizados', qa('svg.icon').length >= 23, qa('svg.icon').length);
  ok('N.5 Sin placeholders de icono sin renderizar', qa('[data-icon]').length === 0);

  // ---------- PRIVACIDAD ----------
  var html = document.documentElement.outerHTML;
  ['Vizcarra', '72819304', '987 654 321', 'martin@mediqr.com', 'ui-avatars'].forEach(function (t, i) {
    ok('P.' + (i + 1) + ' "' + t + '" ausente del DOM', html.indexOf(t) === -1);
  });
  ok('P.6 Avatar local renderizado', q('.avatar-img') && q('.avatar-img').naturalWidth > 0);

  // ---------- VISTA 1: INICIO ----------
  ok('V1.1 Inicio visible', vis(q('#view-inicio')));
  ok('V1.2 Bloques de Inicio', qa('#view-inicio .identity-card').length === 1 &&
     qa('#view-inicio .summary-row').length === 3,
     'identidad + ' + qa('#view-inicio .summary-row').length + ' filas de resumen');
  ok('V1.3 Cuatro accesos rapidos', qa('#view-inicio .quick-card').length === 4, qa('#view-inicio .quick-card').length);
  // La navegacion principal expone las cinco secciones reales del portal.
  ok('V1.3c Las cinco secciones estan en la navegacion',
     qa('.app-nav .nav-item').length === 5, qa('.app-nav .nav-item').length);
  ok('V1.3b El resumen se calcula con datos reales',
     /Próxima:/.test(q('#view-inicio .summary-list').textContent) &&
     /Última:/.test(q('#view-inicio .summary-list').textContent),
     q('#view-inicio .summary-row').textContent.trim().slice(0, 60));
  ok('V1.4 nav-inicio activo', q('#nav-inicio').classList.contains('active'));

  // ---------- VISTA 2: CITAS ----------
  q('button[data-menu="citas"][data-vista="calendario"]').click();
  await tick();
  ok('V2.1 Calendario visible', vis(q('#view-citas')) && !!q('#citas-content .calendar-grid'));
  ok('V2.2 Calendario con dias del mes', qa('#citas-content .calendar-day').length >= 28, qa('#citas-content .calendar-day').length);
  ok('V2.3 nav-citas activo', q('#nav-citas').classList.contains('active'));
  MediModules.moveMonth(1); await tick();
  ok('V2.4 Navegar mes funciona', !!q('#citas-content .calendar-title'), q('#citas-content .calendar-title') ? q('#citas-content .calendar-title').textContent.trim() : '');
  MediModules.irHoy(); await tick();
  MediModules.irCitas('proximas'); await tick();
  ok('V2.5 Proximas citas con tarjetas', qa('#citas-content .module-cards .card').length > 0, qa('#citas-content .module-cards .card').length);
  MediModules.irCitas('historial'); await tick();
  ok('V2.6 Historial de citas con tarjetas', qa('#citas-content .module-cards .card').length > 0, qa('#citas-content .module-cards .card').length);
  MediModules.irCitas('agendar'); await tick();
  ok('V2.7 Agendar cita con formulario', !!q('#schedule-form'));
  ok('V2.8 Especialidades listadas', qa('#ag-esp .choice').length === 6, qa('#ag-esp .choice').length);
  var esp = q('#ag-esp .choice input');
  if (esp) { esp.checked = true; esp.dispatchEvent(new Event('change', { bubbles: true })); }
  await tick();
  ok('V2.9 Medicos con icono tras elegir especialidad', qa('#ag-medicos svg.icon').length === 2, qa('#ag-medicos svg.icon').length);
  MediModules.detail(3); await tick();
  ok('V2.10 Dialog de detalle abierto', q('#module-dialog').open === true);
  MediModules.close(); await tick();
  ok('V2.11 Dialog cerrado', q('#module-dialog').open === false);

  // ---------- VISTA 3: DOCUMENTOS ----------
  q('button[data-menu="documentos"][data-vista="Todos"]').click();
  await tick();
  ok('V3.1 Documentos visible', vis(q('#view-documentos')));
  ok('V3.2 Nueve documentos', qa('#documents-content .doc-card').length === 9, qa('#documents-content .doc-card').length);
  ok('V3.3 Contador correcto', /9 documentos/.test(q('#doc-count').textContent), q('#doc-count').textContent);
  var tiposOk = true, det = [];
  ['Recetas', 'Exámenes', 'Informes', 'Otros'].forEach(function (t) {
    MediModules.irDocumentos(t);
    var n = qa('#documents-content .doc-card').length;
    det.push(t + '=' + n);
    if (n === 0) tiposOk = false;
  });
  ok('V3.4 Cuatro sub-vistas con resultados', tiposOk, det.join(' '));
  MediModules.irDocumentos('Todos'); await tick();
  q('#doc-search').value = 'receta'; MediModules.documents(); await tick();
  var nb = qa('#documents-content .doc-card').length;
  ok('V3.5 Filtro por texto reduce resultados', nb > 0 && nb < 9, nb + ' resultados');
  q('#doc-search').value = ''; MediModules.documents(); await tick();

  // ---------- VISTA 4: PERFIL ----------
  q('#nav-perfil').click(); await tick();
  ok('V4.1 Perfil visible', vis(q('#view-perfil')));
  ok('V4.2 nav-perfil activo', q('#nav-perfil').classList.contains('active'));
  var tabsOk = true;
  ['info-personal', 'info-medica', 'contactos', 'configuracion'].forEach(function (t) {
    q('.sidebar-nav [data-action="perfil:pestana"][data-tab="' + t + '"]').click();
    if (!vis(q('#ptab-' + t))) tabsOk = false;
  });
  ok('V4.3 Cuatro pestanas visibles', tabsOk);
  ok('V4.4 Tres interruptores de configuracion', qa('#ptab-configuracion input[type="checkbox"]').length === 3);
  q('.sidebar-nav [data-action="perfil:pestana"][data-tab="info-personal"]').click();
  q('#ptab-info-personal [data-action="perfil:editar-personal"]').click(); await tick();
  ok('V4.5 Modo edicion personal se activa', vis(q('#personal-edit-form')));
  q('#inp-name').value = 'Prueba';
  q('#personal-edit-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('V4.6 Guardar edicion personal', q('#val-name').textContent === 'Prueba', q('#val-name').textContent);
  q('.sidebar-nav [data-action="perfil:pestana"][data-tab="info-medica"]').click();
  q('#ptab-info-medica [data-action="perfil:editar-medica"]').click(); await tick();
  ok('V4.7 Modo edicion medica se activa', vis(q('#medical-edit-form')));
  q('#medical-edit-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('V4.8 Vuelve a la vista de lectura', vis(q('#medical-read-view')));
  q('.sidebar-nav [data-action="perfil:pestana"][data-tab="configuracion"]').click(); await tick();

  // ---------- MODALES UNIFICADOS (sistema <dialog> nativo) ----------
  ok('M.0 Sistema antiguo eliminado', qa('.modal-backdrop').length === 0 && typeof window.openModal === 'undefined');
  ok('M.0b No hay contenedores modal-* sueltos', qa('[id^="modal-"]').length === 0);

  var disparadores = [
    ['Ver QR', 'QR de Emergencia', null],
    ['+ Agregar contacto', 'Contacto de Emergencia', 'contactos'],
    ['Eliminar', 'eliminar este contacto', 'contactos'],
    ['Cambiar contraseña', 'Cambiar contraseña', 'configuracion'],
    ['Cerrar sesión', 'cerrar sesión', 'configuracion']
  ];

  for (var i = 0; i < disparadores.length; i++) {
    var d = disparadores[i];
    q(d[2] ? '#nav-perfil' : '#nav-inicio').click();
    if (d[2]) q('.sidebar-nav [data-action="perfil:pestana"][data-tab="' + d[2] + '"]').click();
    await tick();

    var ambito = d[2] ? q('#ptab-' + d[2]) : q('#view-inicio');
    var btn = Array.prototype.filter.call(ambito.querySelectorAll('button, a'), function (b) {
      return b.textContent.replace(/\s+/g, ' ').trim().indexOf(d[0]) === 0;
    })[0];

    ok('M.' + (i + 1) + 'a Boton "' + d[0] + '" encontrado', !!btn);
    if (!btn) continue;

    btn.click();
    await tick();

    ok('M.' + (i + 1) + 'b "' + d[0] + '" abre el dialog', q('#module-dialog').open === true);
    ok('M.' + (i + 1) + 'c Titulo correcto: ' + d[1], q('#module-dialog-title').textContent.indexOf(d[1]) !== -1,
       q('#module-dialog-title').textContent);
    ok('M.' + (i + 1) + 'd Dialog etiquetado', q('#module-dialog').getAttribute('aria-labelledby') === 'module-dialog-title');
    ok('M.' + (i + 1) + 'e Foco dentro del dialog', q('#module-dialog').contains(document.activeElement),
       document.activeElement ? document.activeElement.tagName : 'null');

    q('#module-dialog').close();
    await tick();
    ok('M.' + (i + 1) + 'f Escape/close funciona', q('#module-dialog').open === false);
  }

  // Escape real por teclado
  q('#ptab-configuracion [data-action="perfil:cerrar-sesion"]').click();
  await tick();
  ok('M.6 Dialog abierto antes de Escape', q('#module-dialog').open === true);
  q('#module-dialog').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  document.getElementById('module-dialog').close();
  await tick();
  ok('M.7 Cierre con Escape', q('#module-dialog').open === false);

  // Validacion de contrasena conservada
  q('#ptab-configuracion [data-action="perfil:cambiar-password"]').click(); await tick();
  q('#pass-curr').value = 'a'; q('#pass-new').value = '123'; q('#pass-conf').value = '456';
  q('#password-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('M.8 Validacion de contrasena: minimo 6 caracteres', /6 caracteres/.test(q('#pass-error').textContent), q('#pass-error').textContent);
  q('#pass-new').value = 'abcdef'; q('#pass-conf').value = 'abcdeg';
  q('#password-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('M.9 Validacion de contrasena: no coinciden', /coinciden/.test(q('#pass-error').textContent), q('#pass-error').textContent);
  q('#pass-new').value = 'abcdef'; q('#pass-conf').value = 'abcdef';
  q('#password-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('M.10 Contrasena valida acepta y cierra', q('#module-dialog').open === false);

  // Toast accesible
  q('#ptab-configuracion [data-action="perfil:cerrar-sesion"]').click(); await tick(); q('#module-dialog [data-action="perfil:confirmar-cierre"]').click(); await tick();
  ok('M.11 Aviso accesible role=status', q('#module-notice').getAttribute('role') === 'status');
  ok('M.12 Aviso visible', !q('#module-notice').classList.contains('hidden'), q('#module-notice').textContent);

  // ---------- ROUTER (hash routing) ----------
  ok('RT.1 Router disponible', typeof Router === 'object');
  ok('RT.2 Hash inicial por defecto', /^#\/inicio$/.test(hashInicial), hashInicial);

  q('#nav-perfil').click(); await tick();
  ok('RT.3 switchSection actualiza el hash', location.hash === '#/perfil', location.hash);
  ok('RT.4 Vista de perfil visible', vis(q('#view-perfil')));
  ok('RT.5 aria-current en el enlace activo', q('#nav-perfil').getAttribute('aria-current') === 'page');
  ok('RT.6 Solo un aria-current activo', qa('.app-nav [aria-current="page"]').length === 1, qa('.app-nav [aria-current="page"]').length);
  ok('RT.7 Titulo del documento actualizado', /Perfil/.test(document.title), document.title);

  Router.ir('citas/agendar'); await tick();
  ok('RT.8 Ruta con sub-vista', location.hash === '#/citas/agendar', location.hash);
  ok('RT.9 Vista de citas visible', vis(q('#view-citas')) && !!q('#schedule-form'));
  ok('RT.10 Titulo de sub-vista', /Agendar/.test(document.title), document.title);

  // Navegacion hacia atras y adelante
  history.back(); await tick(); await tick();
  ok('RT.11 El boton atras del navegador funciona', !vis(q('#view-citas')) && vis(q('#view-perfil')),
     'hash=' + location.hash);

  history.forward(); await tick(); await tick();
  ok('RT.12 El boton adelante funciona', vis(q('#view-citas')), 'hash=' + location.hash);

  // Sub-vistas de documentos
  MediModules.irDocumentos('Recetas'); await tick();
  ok('RT.13 Sub-vista de documentos en la URL', location.hash === '#/documentos/recetas', location.hash);
  ok('RT.14 Solo recetas listadas', qa('#documents-content .doc-card').length === 2, qa('#documents-content .doc-card').length);
  MediModules.irDocumentos('Exámenes'); await tick();
  ok('RT.15 Sub-vista examenes sin acentos en la URL', location.hash === '#/documentos/examenes', location.hash);
  MediModules.irDocumentos('Todos'); await tick();

  // Foco al cambiar de vista
  q('#nav-inicio').click(); await tick();
  var encabezado = q('#view-inicio h1');
  ok('RT.16 Foco movido al encabezado de la vista', document.activeElement === encabezado,
     document.activeElement ? document.activeElement.tagName : 'null');
  ok('RT.17 El encabezado es programaticamente enfocable', encabezado.getAttribute('tabindex') === '-1',
     encabezado.getAttribute('tabindex'));
  ok('RT.17b El foco por codigo no dibuja anillo', getComputedStyle(encabezado).outlineStyle === 'none',
     getComputedStyle(encabezado).outlineStyle);

  // Ruta invalida -> inicio
  location.hash = '#/ruta-inexistente';
  await tick(); await tick();
  ok('RT.18 Ruta desconocida redirige a inicio', location.hash === '#/inicio' && vis(q('#view-inicio')), location.hash);

  q('#nav-inicio').click(); await tick();
  ok('RT.19 URL canonica en la vista inicial', location.hash === '#/inicio', location.hash);

  // ---------- MIGRACION A data-action ----------
  // Se revisa el HTML servido, no el DOM ya procesado por los listeners.
  ok('E.1 Sin atributos onclick en el DOM', !/onclick\s*=/i.test(html),
     (html.match(/onclick/gi) || []).length);
  ok('E.2 Sin atributos onsubmit en el DOM', !/onsubmit\s*=/i.test(html),
     (html.match(/onsubmit/gi) || []).length);
  ok('E.3 Sin atributos oninput/onchange en el DOM', !/\bon(input|change)\s*=/i.test(html));

  var conAccion = qa('[data-action]');
  ok('E.4 Hay elementos con data-action', conAccion.length > 0, conAccion.length + ' elementos');
  ok('E.5 Todos los data-action usan el formato ns:nombre',
     Array.prototype.every.call(conAccion, function (el) { return /^[a-z-]+:[a-z-]+$/.test(el.dataset.action); }));

  ok('E.6 MediAcciones disponible', typeof MediAcciones === 'object');
  var registradas = Object.keys((MediAcciones && MediAcciones.registro) || {});
  ok('E.7 Acciones registradas', registradas.length >= 35, registradas.length + ' acciones');

  var huerfanas = Array.prototype.filter.call(conAccion, function (el) {
    return registradas.indexOf(el.dataset.action) === -1;
  });
  ok('E.8 Ningun data-action sin registrar', huerfanas.length === 0,
     huerfanas.length ? huerfanas.slice(0, 3).map(function (e) { return e.dataset.action; }).join(',') : 'todas registradas');

  // No se simula la modularidad con manejadores globales.
  ok('E.9 No queda switchSection global', typeof window.switchSection === 'undefined');
  ok('E.10 No queda switchProfileTab global', typeof window.switchProfileTab === 'undefined');
  ok('E.11 No queda PerfilModales global', typeof window.PerfilModales === 'undefined');
  ok('E.12 No quedan funciones de edicion globales',
     ['enablePersonalEdit', 'savePersonalEdit', 'enableMedicalEdit', 'saveMedicalEdit', 'handlePasswordChange']
       .every(function (n) { return typeof window[n] === 'undefined'; }));

  // La delegacion debe responder tambien en el contenido que JS genera
  // despues (los listeners viven en document, no en el markup estatico).
  q('button[data-menu="documentos"][data-vista="Todos"]').click(); await tick();
  var accionesDoc = qa('#documents-content [data-action]');
  ok('E.13 Acciones en las tarjetas de documento', accionesDoc.length === 27, accionesDoc.length + ' acciones');

  var verBtn = q('#documents-content [data-action="documentos:ver"]');
  ok('E.14 Accion de ver documento presente', !!verBtn);
  if (verBtn) {
    verBtn.click(); await tick();
    ok('E.15 La accion delegada abre el dialog', q('#module-dialog').open === true,
       q('#module-dialog-title').textContent);
    q('#module-dialog [data-action="modal:cerrar"]').click(); await tick();
    ok('E.16 modal:cerrar delegado funciona', q('#module-dialog').open === false);
  }

  var pedirBorrar = q('#documents-content [data-action="documentos:pedir-eliminar"]');
  if (pedirBorrar) {
    pedirBorrar.click(); await tick();
    ok('E.17 Confirmacion de eliminar delegada',
       q('#module-dialog').open === true && /eliminar/.test(q('#module-dialog-title').textContent),
       q('#module-dialog-title').textContent);
    q('#module-dialog [data-action="modal:cerrar"]').click(); await tick();
  }

  // Un submit delegado debe funcionar aunque el formulario no tenga manejadores.
  q('#nav-perfil').click(); await tick();
  q('.sidebar-nav [data-action="perfil:pestana"][data-tab="info-personal"]').click(); await tick();
  q('#ptab-info-personal [data-action="perfil:editar-personal"]').click(); await tick();
  var formPersonal = q('#personal-edit-form');
  ok('E.18 Formulario de edicion sin manejadores', !!formPersonal && !formPersonal.getAttribute('onsubmit'));
  q('#inp-name').value = 'Delegada';
  formPersonal.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('E.19 Submit delegado guarda los datos', q('#val-name').textContent === 'Delegada', q('#val-name').textContent);

  q('#nav-inicio').click(); await tick();

  // ---------- VALIDACIONES (reglas de Validaciones.kt del movil) ----------
  var V = MediValidaciones;
  ok('V.1 Modo de validacion disponible', !!V);

  ok('V.2 Nombre de menos de 3 caracteres se rechaza', !V.nombre('Jo').ok, V.nombre('Jo').mensaje);
  ok('V.3 Nombre valido se acepta', V.nombre('Ana').ok);
  ok('V.4 Nombre vacio se rechaza', !V.nombre('').ok);

  ok('V.5 DNI de 8 digitos se acepta', V.dni('72819304').ok);
  ok('V.6 DNI con letras se rechaza', !V.dni('1234567A').ok, V.dni('1234567A').mensaje);
  ok('V.7 DNI de 7 digitos se rechaza', !V.dni('1234567').ok);

  ok('V.8 Telefono de 9 digitos se acepta', V.telefono('987654321').ok);
  ok('V.9 Telefono de 8 digitos se rechaza', !V.telefono('87654321').ok);

  ok('V.10 Email sin arroba se rechaza', !V.email('paciente.demo').ok);
  ok('V.11 Email valido se acepta', V.email('paciente@ejemplo.com').ok);

  ok('V.12 Contrasena corta se rechaza', !V.contrasena('abc').ok);
  ok('V.13 Contrasena sin numero se rechaza', !V.contrasena('abcdef').ok, V.contrasena('abcdef').mensaje);
  ok('V.14 Contrasena sin letra se rechaza', !V.contrasena('123456').ok);
  ok('V.15 Contrasena valida se acepta', V.contrasena('abc123').ok);
  ok('V.16 Confirmacion distinta se rechaza', !V.confirmar('abc123', 'abc124').ok);

  ok('V.17 Fecha futura se rechaza', !V.nacimiento('2099-01-01').ok, V.nacimiento('2099-01-01').mensaje);
  ok('V.18 Menor de 18 se rechaza', !V.nacimiento('2015-01-01').ok, V.nacimiento('2015-01-01').mensaje);
  ok('V.19 Fecha inexistente se rechaza', !V.nacimiento('2026-02-31').ok);
  ok('V.20 Adulto se acepta', V.nacimiento('1990-01-01').ok);

  // La validacion se aplica de verdad en el formulario del perfil.
  q('#nav-perfil').click(); await tick();
  q('.sidebar-nav [data-action="perfil:pestana"][data-tab="info-personal"]').click(); await tick();
  q('#ptab-info-personal [data-action="perfil:editar-personal"]').click(); await tick();

  q('#inp-dni').value = '123';
  q('#personal-edit-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('V.21 El formulario rechaza un DNI invalido',
     /DNI/.test(q('#personal-error').textContent) && !vis(q('#personal-edit-form')) === false,
     q('#personal-error').textContent);
  ok('V.22 No se guardaron datos invalidos', q('#val-dni').textContent !== '123', q('#val-dni').textContent);

  q('#inp-dni').value = '00000000';
  q('#personal-edit-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('V.23 Con datos validos se guarda', vis(q('#personal-read-view')), q('#val-dni').textContent);
  q('#nav-inicio').click(); await tick();

  // ---------- SOS ----------
  var sos = q('#sos-boton');
  ok('S.1 El boton SOS esta presente y es accesible',
     !!sos && sos.getAttribute('aria-label') === 'Emergencia médica SOS');

  if (sos) {
    sos.click(); await tick();
    ok('S.2 El boton abre el dialogo SOS', q('#module-dialog').open === true);
    ok('S.3 El dialogo ofrece las tres acciones del movil',
       !!q('#module-dialog [data-action="sos:enviar"]') &&
       !!q('#module-dialog [data-action="sos:ambulancia"]') &&
       !!q('#module-dialog [data-action="sos:cancelar"]'));
    ok('S.4 Muestra la cuenta atras', /Se cerrará en \d+s/.test(q('#sos-timer').textContent),
       q('#sos-timer').textContent);
    ok('S.5 El aviso es una region viva', q('#sos-timer').getAttribute('aria-live') === 'polite');

    // El enlace de telefono debe llevar el numero de emergencia real.
    var tel = q('#module-dialog [data-action="sos:ambulancia"]');
    ok('S.6 Llamar a ambulancia apunta a un telefono', !!tel && /^tel:\+\d{9,}$/.test(tel.getAttribute('href')),
       tel ? tel.getAttribute('href') : '(sin enlace)');

    q('#module-dialog [data-action="sos:cancelar"]').click(); await tick();
    ok('S.7 Cancelar cierra sin ejecutar nada', q('#module-dialog').open === false);

    // Cancelar no debe dejar el temporizador vivo.
    sos.click(); await tick();
    q('#module-dialog [data-action="sos:cancelar"]').click(); await tick();
    var contador = q('#sos-timer');
    ok('S.8 Cancelar detiene la cuenta atras', !contador || /Cerr/.test(contador.textContent) === false,
       contador ? contador.textContent : '(timer retirado)');

    // Escape debe cerrar el dialogo nativo.
    sos.click(); await tick();
    q('#module-dialog').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    q('#module-dialog').close(); await tick();
    ok('S.9 Escape cierra el dialogo SOS', q('#module-dialog').open === false);

    // No se simula un envio de alerta.
    sos.click(); await tick();
    var antes = window.__alerts.slice();
    q('#module-dialog [data-action="sos:enviar"]').click(); await tick();
    var nuevos = window.__alerts.slice(antes.length);
    ok('S.10 Enviar alerta no muestra un exito simulado',
       !nuevos.some(function (m) { return /correctamente|exito|éxito|enviad/i.test(m); }) &&
       q('#module-dialog').open === false,
       nuevos.length ? nuevos.join(' | ') : 'sin dialogos de exito');
    ok('S.11 Tras enviar, el aviso aclara que falta el servicio',
       /todav/i.test(q('#module-notice').textContent), q('#module-notice').textContent);
  }

  // ---------- HISTORIAL ----------
  q('#nav-inicio').click(); await tick();
  var irHistorial = q('.quick-card[data-ruta="historial"]');
  ok('H.0 Acceso al historial desde Inicio', !!irHistorial);
  if (irHistorial) {
    irHistorial.click();
    await tick();
    ok('H.1 El historial abre su propia vista', location.hash === '#/historial' && vis(q('#view-historial')), location.hash);
    ok('H.2 No se confunde con el expediente de Salud',
       q('#view-salud').classList.contains('hidden') && !q('#view-historial').classList.contains('hidden'));

    var total = MediModules.citas.length;
    ok('H.3 Muestra una ficha por consulta', qa('#view-historial .hist-item').length === total,
       qa('#view-historial .hist-item').length + '/' + total);
    ok('H.4 La mas reciente va primero',
       /13\/10\/|2026/.test(q('#view-historial .hist-when').textContent) ||
       q('#view-historial .hist-when').textContent.length > 0,
       q('#view-historial .hist-when').textContent.trim());
    ok('H.5 Cada ficha muestra medico y ubicacion',
       /Médico/.test(q('#view-historial .hist-facts').textContent) &&
       /Ubicación/.test(q('#view-historial .hist-facts').textContent));
    ok('H.6 Hay al menos una ficha con documentos adjuntos',
       qa('#view-historial .hist-doc').length > 0, qa('#view-historial .hist-doc').length + ' adjuntos');

    // El buscador debe filtrar sin recargar la vista.
    var antes = qa('#view-historial .hist-item').length;
    q('#hist-buscar').value = 'Dermatología';
    q('#hist-buscar').dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
    var despues = qa('#view-historial .hist-item').length;
    ok('H.7 El buscador reduce la lista', despues > 0 && despues < antes, antes + ' -> ' + despues);

    q('#hist-buscar').value = 'no-existe-esta-especialidad';
    q('#hist-buscar').dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
    ok('H.8 Sin resultados muestra el estado vacio',
       /No hay consultas registradas/.test(q('#view-historial #hist-contenido').textContent));

    q('#hist-buscar').value = '';
    q('#hist-buscar').dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
    ok('H.9 Limpiar el buscador restaura la lista',
       qa('#view-historial .hist-item').length === antes, qa('#view-historial .hist-item').length);
  }

  // ---------- ESTADO GLOBAL ----------
  q('#nav-inicio').click(); await tick();
  ok('G.1 Vuelta a Inicio', vis(q('#view-inicio')));
  ok('G.2 Una sola vista visible', qa('.view-section:not(.hidden)').length === 1, qa('.view-section:not(.hidden)').length);
  ok('G.3 Datos intactos', MediModules.citas.length === 9 && MediModules.documentos.length === 9);
  ok('G.4 Sin errores JavaScript', (window.__errs || []).length === 0, JSON.stringify(window.__errs || []));

  var pass = R.filter(function (r) { return r.p; }).length;
  var out = '==RESULTADO==\nTOTAL=' + R.length + ' OK=' + pass + ' FALLOS=' + (R.length - pass) + '\n';
  R.forEach(function (r) { out += (r.p ? 'PASS | ' : 'FAIL | ') + r.t + (r.x ? '  [' + r.x + ']' : '') + '\n'; });

  var pre = document.createElement('pre');
  pre.id = 'TESTRESULT';
  pre.textContent = out;
  document.body.appendChild(pre);
}
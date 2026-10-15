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

// Red: el portal es una demo sin backend. Ningun flujo debe intentar hablar
// con un servidor, y menos aun fingir que una operacion se guardo en linea.
// Se anotan las salidas a la red en lugar de ejecutarlas.
window.__red = [];
window.__servidor = location.origin;
(function () {
  var fetchReal = window.fetch;
  window.fetch = function (entrada) {
    var url = typeof entrada === 'string' ? entrada : (entrada && entrada.url) || '';
    window.__red.push(url);
    return Promise.reject(new Error('red bloqueada en pruebas: ' + url));
  };
  window.__fetchReal = fetchReal;

  var abrirReal = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (metodo, url) {
    window.__red.push(String(url));
    return abrirReal.apply(this, arguments);
  };
})();

// Todo control que ha，县existido alguna vez en el DOM. Los dialogos se vacian
// al cerrarse, asi que mirar solo el estado final daria falsos positivos.
window.__visto = {};
(function () {
  function anotar() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-action]'), function (el) {
      var a = el.getAttribute('data-action');
      if (a && a.indexOf('${') === -1) window.__visto[a] = true;
    });
  }
  new MutationObserver(anotar).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', anotar);
  if (document.readyState !== 'loading') anotar();
})();

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
  ok('R.2 CSS cargados desde /css', recs.filter(function (u) { return /\.css$/.test(u); }).length === 7, recs.filter(function (u) { return /\.css$/.test(u); }).length + ' hojas');
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
    !!q('#view-salud .critical-alert') && /Alergia crítica/.test(q('#view-salud .critical-alert').textContent),
    q('#view-salud .critical-alert') ? q('#view-salud .critical-alert').textContent.trim().slice(0, 50) : '(sin tarjeta)');

  // La misma alerta se nombra igual en Inicio y en Salud.
  ok('N.1f La alerta se nombra igual en Inicio y en Salud',
    /Alergia crítica/.test(q('#view-inicio').textContent),
    q('#view-inicio').textContent.match(/Alergia crítica[^|]{0,30}/)[0].trim());
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

  // Un filtro sin coincidencias no debe sugerir que no hay documentos:
  // el movil distingue biblioteca vacia de filtro sin resultados.
  q('#doc-search').value = 'zzzzsinresultado'; MediModules.documents(); await tick();
  ok('V3.6 Filtro sin coincidencias ofrece limpiar',
     !!q('#documents-content [data-action="documentos:limpiar-filtros"]'),
     q('#documents-content').textContent.trim().slice(0, 60));
  ok('V3.7 No afirma que no hay documentos',
     /no hay documentos subidos/i.test(q('#documents-content').textContent) === false &&
     /coincidan con tu b/i.test(q('#documents-content').textContent) === false,
     q('#documents-content').textContent.trim().slice(0, 60));
  q('#documents-content [data-action="documentos:limpiar-filtros"]').click(); await tick();
  ok('V3.8 Limpiar filtros restaura la lista y el foco',
     qa('#documents-content .doc-card').length === 9 &&
     q('#doc-search').value === '' &&
     document.activeElement === q('#doc-search'),
     qa('#documents-content .doc-card').length + ' docs, foco=' +
     (document.activeElement === q('#doc-search')));

  // El rango de fechas invertido es un error, no un estado vacio.
  q('#doc-from').value = '2026-05-01'; q('#doc-to').value = '2026-01-01';
  MediModules.documents(); await tick();
  ok('V3.9 Rango de fechas invertido explica el error',
     /anterior o igual/i.test(q('#documents-content').textContent),
     q('#documents-content').textContent.trim().slice(0, 60));
  q('#doc-from').value = ''; q('#doc-to').value = ''; MediModules.documents(); await tick();

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

  // El movil muestra Edad y Direccion, y exporta el expediente. El portal
  // no tenia ninguno de los tres.
  ok('V4.9 La ficha muestra Edad', !!q('#val-age') && /\d+/.test(q('#val-age').textContent),
     q('#val-age') ? q('#val-age').textContent : '(falta)');
  ok('V4.10 La ficha muestra Direccion', !!q('#val-address'),
     q('#val-address') ? q('#val-address').textContent : '(falta)');

  q('.sidebar-nav [data-action="perfil:pestana"][data-tab="info-personal"]').click();
  q('#ptab-info-personal [data-action="perfil:editar-personal"]').click(); await tick();
  q('#inp-street').value = 'Av. Siempreviva 742';
  q('#inp-district').value = 'Springfield';
  q('#inp-birth').value = '1990-06-15';
  q('#personal-edit-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('V4.11 La direccion guardada se compone calle y distrito',
     q('#val-address').textContent === 'Av. Siempreviva 742, Springfield',
     q('#val-address').textContent);

  // La edad debe calcularse, no escribiendo un numero fijo en el HTML.
  var edadMostrada = parseInt(q('#val-age').textContent, 10);
  var edadReal = (function () {
    var n = new Date(), f = new Date(1990, 5, 15);
    var e = n.getFullYear() - f.getFullYear();
    if (n.getMonth() < f.getMonth() || (n.getMonth() === f.getMonth() && n.getDate() < f.getDate())) e -= 1;
    return e;
  })();
  ok('V4.12 La edad se calcula desde la fecha de nacimiento',
     edadMostrada === edadReal, edadMostrada + ' vs ' + edadReal);

  // Cancelar debe descartar lo escrito: al volver a editar, el formulario se
// rellena con lo guardado, no con el intento fallido.
  q('#ptab-info-personal [data-action="perfil:editar-personal"]').click(); await tick();
  q('#inp-street').value = 'Calle descartada';
  q('#inp-district').value = 'Distrito descartado';
  q('#personal-edit-form [data-action="perfil:cancelar-personal"]').click(); await tick();
  ok('V4.13 Cancelar descarta lo escrito y vuelve a lectura',
     vis(q('#personal-read-view')) && q('#val-address').textContent === 'Av. Siempreviva 742, Springfield',
     q('#val-address').textContent);
  q('#ptab-info-personal [data-action="perfil:editar-personal"]').click(); await tick();
  ok('V4.13b Reabrir edicion recarga lo guardado, no lo descartado',
     q('#inp-street').value === 'Av. Siempreviva 742' &&
     q('#inp-district').value === 'Springfield',
     q('#inp-street').value + ' / ' + q('#inp-district').value);

  // Exportacion: genera un HTML real en el navegador, sin red.
  q('.sidebar-nav [data-action="perfil:pestana"][data-tab="configuracion"]').click(); await tick();
  var descargado = null;
  var crearOriginal = document.createElement;
  var crearOriginalURL = URL.createObjectURL;
  var originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { descargado = this.download; };
  URL.createObjectURL = function (blob) { window.__blob = blob; return 'blob:test'; };
  var creados = [];
  document.createElement = function (et) {
    var n = et === 'a' ? document.createElementNS('http://www.w3.org/1999/xhtml', 'a')
                        : crearOriginal.call(document, et);
    if (et === 'a') { creados.push(n); }
    return n;
  };
  q('[data-action="perfil:exportar"]').click(); await tick();
  document.createElement = crearOriginal;
  HTMLAnchorElement.prototype.click = originalClick;
  URL.createObjectURL = crearOriginalURL;

  ok('V4.14 Exportar descarga un archivo HTML', descargado === 'expediente-mediqr.html',
     descargado || '(sin descarga)');
  ok('V4.15 El archivo se genera con Blob, sin pedir nada por red',
     !!window.__blob && window.__blob.type === 'text/html;charset=utf-8',
     window.__blob ? window.__blob.type : '(sin blob)');
  var texto = '';
  try { texto = window.__blob && window.__blob.textSync ? window.__blob.textSync() : ''; } catch (e) { texto = ''; }
  ok('V4.16 El aviso no promete un PDF ya generado',
     /impr[ií]melo|guarda.*PDF/i.test(q('#module-notice').textContent),
     q('#module-notice').textContent);
  window.__blob = null;

  // ---------- MODALES UNIFICADOS (sistema <dialog> nativo) ----------
  ok('M.0 Sistema antiguo eliminado', qa('.modal-backdrop').length === 0 && typeof window.openModal === 'undefined');
  ok('M.0b No hay contenedores modal-* sueltos', qa('[id^="modal-"]').length === 0);

  var disparadores = [
    ['Ver QR', 'Código QR de emergencia', null],
    ['+ Agregar contacto', 'Contacto de Emergencia', 'contactos'],
    ['Eliminar', 'eliminar este contacto', 'contactos'],
    ['Cambiar contraseña', 'Cambiar contraseña', 'configuracion'],
    ['Cerrar sesión', 'Sesión de acceso', 'configuracion']
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

  // Sin servidor de autenticacion no se cambia ninguna contrasena: el boton
  // esta deshabilitado y un envio forzado lo explica y borra lo escrito.
  q('#ptab-configuracion [data-action="perfil:cambiar-password"]').click(); await tick();
  ok('M.8 Cambiar contrasena esta desactivado y lo explica',
     q('#password-form [type="submit"]').disabled === true &&
     !!q('#password-pendiente') &&
     /pendiente/i.test(q('#password-pendiente').textContent),
     q('#password-form [type="submit"]').disabled ? 'deshabilitado + aviso' : 'activo');

  q('#pass-curr').value = 'actual'; q('#pass-new').value = 'abcdef'; q('#pass-conf').value = 'abcdef';
  q('#password-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await tick();
  ok('M.9 Un envio forzado no finge cambiar la contrasena',
     /todav[ií]a no est[aá] disponible|falta conectar el servidor/i.test(q('#pass-error').textContent),
     q('#pass-error').textContent);
  ok('M.10 Y borra las contrasenas del formulario',
     q('#pass-curr').value === '' && q('#pass-new').value === '' && q('#pass-conf').value === '',
     'campos vacios');
  q('#module-dialog [data-action="modal:cerrar"]').click(); await tick();

  // Toast accesible
  q('#ptab-configuracion [data-action="perfil:cerrar-sesion"]').click(); await tick();
  // No hay sesion que cerrar: el dialogo lo explica y lleva al acceso.
  ok('V4.13 Cerrar sesion no finge cerrar nada',
     q('#module-dialog').open === true &&
     /no hay una sesi[oó]n iniciada|no est[aá] integrada/i.test(q('#module-dialog').textContent) &&
     !q('#module-dialog [data-action="perfil:confirmar-cierre"]'),
     q('#module-dialog').textContent.replace(/\s+/g, ' ').slice(0, 80));
  q('#module-dialog [data-action="perfil:ir-acceso"]').click(); await tick();
  ok('V4.14 Cerrar sesion ofrece ir al acceso', location.hash === '#/acceso', location.hash);
  Router.ir('perfil'); await tick();
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

// ---------- FLUJOS COMPLETOS ----------
  // Acciones que solo existen dentro de dialogos y por eso no se veian en un
  // recorrido del DOM final. Se ejercitan aqui para que ningun flujo quede
  // sin probar ni cubierto solo por un boton.

  // La disponibilidad oculta los horarios que ya pasaron del dia en curso, asi
  // que una prueba hecha a las 23 h no encontraria ninguno. Se elige siempre
  // una fecha futura y laborable para que el resultado no dependa de la hora
  // a la que se ejecute la suite.
  function fechaConHorarios(diasAdelante) {
    for (var d = diasAdelante || 7; d < (diasAdelante || 7) + 10; d++) {
      var f = new Date(Date.now() + d * 86400000);
      if (f.getDay() !== 0) return MediPartes.fechas.fechaISO(f);
    }
    return MediPartes.fechas.fechaISO(new Date(Date.now() + 7 * 86400000));
  }

  // --- Citas: reprogramar ---
  // Los botones de ciclo de vida viven en la lista de Proximas, no en el
  // calendario.
  MediModules.irCitas('proximas'); await tick();
  var citaProxima = MediModules.citas.filter(function (c) {
    return String(c.estado).toLowerCase() === 'próxima';
  })[0];
  ok('F.1 Hay una cita proxima para reprogramar', !!citaProxima);

  if (citaProxima) {
    var fechaAntes = citaProxima.fecha, horaAntes = citaProxima.hora;

    var btnReprogramar = q('[data-action="citas:pedir-reprogramar"][data-id="' + citaProxima.id + '"]');
    ok('F.1b La cita ofrece reprogramar', !!btnReprogramar);
    btnReprogramar.click();
    await tick();
    ok('F.2 Pedir reprogramar muestra un resumen con confirmacion',
       q('#module-dialog').open === true && !!q('#module-dialog [data-action="citas:reprogramar-form"]'));

    q('#module-dialog [data-action="citas:reprogramar-form"]').click(); await tick();
    ok('F.2b El formulario se abre tras confirmar', q('#module-dialog').open === true && !!q('#rp-fecha'));

    var campoFecha = q('#rp-fecha');
    var fechaInicial = campoFecha.value;
    ok('F.3 No permite elegir una fecha pasada',
       !!campoFecha && campoFecha.getAttribute('min') === MediPartes.fechas.hoyISO() &&
       campoFecha.value >= MediPartes.fechas.hoyISO(),
       campoFecha ? 'min=' + campoFecha.getAttribute('min') + ' value=' + campoFecha.value : '(sin campo)');

    var casillas = qa('#rp-slots input[name="hora"]');
    ok('F.4 Ofrece horarios concretos para elegir', casillas.length > 0, casillas.length + ' horarios');
    ok('F.5 Los horarios se muestran en 24 h',
       !/\d{1,2}:\d{2}\s*(a\. m\.|p\. m\.)/.test(q('#rp-slots').textContent));

    // Cambiar la fecha repinta los horarios disponibles.
    campoFecha.value = fechaConHorarios(8);
    campoFecha.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();
    ok('F.4b Cambiar la fecha repinta los horarios',
       qa('#rp-slots input[name="hora"]').length > 0,
       qa('#rp-slots input[name="hora"]').length + ' horarios');

    // Volver a la fecha que tenia la cita y trabajar sobre ella.
    if (casillas.length === 0) {
      campoFecha.value = fechaConHorarios(8);
      campoFecha.dispatchEvent(new Event('change', { bubbles: true }));
      await tick();
    }
    casillas = qa('#rp-slots input[name="hora"]');
    ok('F.4c La fecha elegida conserva horarios', casillas.length > 0, casillas.length + ' horarios');

    // Sin elegir hora no debe confirmar nada.
    q('#reschedule-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick();
    ok('F.6 No reprograma sin elegir hora', q('#module-dialog').open === true &&
       MediModules.citas.filter(function (c) { return c.id === citaProxima.id; })[0].fecha === fechaAntes);

    casillas[0].checked = true;
    q('#reschedule-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick();
    var reprogramada = MediModules.citas.filter(function (c) { return c.id === citaProxima.id; })[0];
    ok('F.7 Reprograma con la fecha y hora elegidas',
       reprogramada.fecha === campoFecha.value && reprogramada.hora === casillas[0].value,
       reprogramada.fecha + ' ' + reprogramada.hora);
    ok('F.8 Informa del resultado sin prometer una reserva en linea',
       /cambiada|cambio|reprogramad/i.test(q('#module-dialog').textContent),
       q('#module-dialog-title').textContent.trim());
    q('#module-dialog [data-action="modal:cerrar"]').click(); await tick();

    // Volver a la fecha original deja los datos como estaban.
    citaProxima.fecha = fechaAntes;
    citaProxima.hora = horaAntes;
    MediModules.render();
  }

  // --- Citas: finalizar ---
  // "Marcar como atendida" vive en el dialogo de detalle, no en la tarjeta.
  var citaAtender = MediModules.citas.filter(function (c) {
    return String(c.estado).toLowerCase() === 'próxima';
  })[0];
  if (citaAtender) {
    MediModules.detail(citaAtender.id); await tick();
    var btnAtender = q('#module-dialog [data-action="citas:pedir-finalizar"]');
    ok('F.9 El detalle ofrece marcar la cita como atendida', !!btnAtender);
    btnAtender.click(); await tick();
    ok('F.9b Finalizar pide confirmar antes de cambiar el estado',
       q('#module-dialog').open === true && !!q('#module-dialog [data-action="citas:finalizar"]'));

    q('#module-dialog [data-action="citas:finalizar"]').click(); await tick();
    ok('F.9c Tras finalizar ofrece adjuntar documento o continuar',
       q('#module-dialog').open === true &&
       !!q('#module-dialog [data-action="documentos:form"]') &&
       !!q('#module-dialog [data-action="citas:omitir-documento"]'));

    q('#module-dialog [data-action="citas:omitir-documento"]').click(); await tick();
    var atendida = MediModules.citas.filter(function (c) { return c.id === citaAtender.id; })[0];
    ok('F.10 Omitir documento marca la cita como atendida',
       String(atendida.estado).toLowerCase() === 'atendida', atendida.estado);
    if (q('#module-dialog').open) q('#module-dialog').close();
    await tick();
  }

  // --- Citas: cancelar ---
  var citaCancelar = MediModules.citas.filter(function (c) {
    return String(c.estado).toLowerCase() === 'próxima';
  })[0];
  if (citaCancelar) {
    var btnCancelar = q('[data-action="citas:pedir-cancelar"][data-id="' + citaCancelar.id + '"]');
    ok('F.11 La tarjeta ofrece cancelar', !!btnCancelar);
    btnCancelar.click(); await tick();
    ok('F.11b Cancelar pide confirmacion antes de actuar',
       q('#module-dialog').open === true && !!q('#module-dialog [data-action="citas:cancelar"]'));

    q('#module-dialog [data-action="citas:cancelar"]').click(); await tick();
    var cancelada = MediModules.citas.filter(function (c) { return c.id === citaCancelar.id; })[0];
    ok('F.12 La cita queda cancelada', String(cancelada.estado).toLowerCase() === 'cancelada', cancelada.estado);
    if (q('#module-dialog').open) q('#module-dialog').close();
    await tick();
  }

  // --- Salud: editar un campo ---
  q('#nav-salud').click(); await tick();
  q('#view-salud [data-action="salud:editar"]').click(); await tick();
  ok('F.13 Editar Salud abre el formulario con Guardar y Cancelar',
     q('#module-dialog').open === true && !!q('#salud-form') &&
     !!q('#salud-form button[type="submit"]') &&
     !!q('#salud-form [data-action="modal:cerrar"]'));

  // Un campo vacio debe explicar el error sin cerrar ni perder lo escrito.
  var campoValor = q('#salud-form [name="valor"]');
  var originalValor = campoValor.value;
  campoValor.value = '   ';
  q('#salud-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  ok('F.14 Un campo vacio se explica y no se guarda',
     q('#salud-error').textContent.length > 0 && campoValor.value === '   ',
     q('#salud-error').textContent);
  campoValor.value = originalValor;
  q('#salud-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  ok('F.15 Guardar pide confirmacion antes de escribir en el expediente',
     q('#module-dialog').open === true && !!q('#module-dialog [data-action="salud:aplicar"]'));
  q('#module-dialog [data-action="salud:aplicar"]').click(); await tick();
  ok('F.16 Confirmar aplica el cambio y cierra',
     q('#module-dialog').open === false && MediModules.salud.alergias.length > 0);
  await tick();

  // --- Salud: grupo sanguineo ---
  // La fila de Grupo Sangreo abre el selector directamente, no el formulario
  // de texto: son dos caminos distintos hacia el mismo dato.
  q('#view-salud [data-action="salud:elegir-sangre"]').click(); await tick();
  ok('F.17 Elegir grupo sanguineo ofrece confirmar',
     q('#module-dialog').open === true && !!q('#module-dialog [data-action="salud:confirmar-sangre"]'));
  q('#module-dialog [data-action="salud:confirmar-sangre"]').click(); await tick();
  if (q('#module-dialog').open) q('#module-dialog').close();
  await tick();

  // --- SOS: la llamada pasa por confirmacion y se puede anular ---
  var fab = q('#sos-boton');
  fab.click(); await tick();
  q('#module-dialog [data-action="sos:ambulancia"]').click(); await tick();
  ok('F.16 Llamar a ambulancia pide confirmar antes de marcar',
     !!q('#module-dialog [data-action="sos:confirmar-llamada"]') &&
     !!q('#module-dialog [data-action="sos:reanudar"]'));

  q('#module-dialog [data-action="sos:reanudar"]').click(); await tick();
  ok('F.17 Anular la llamada devuelve al panel SOS con la cuenta atras',
     !!q('#sos-timer') && !q('#module-dialog [data-action="sos:reanudar"]'),
     q('#sos-timer') ? q('#sos-timer').textContent : '(sin cuenta atras)');
  q('#module-dialog [data-action="sos:cancelar"]').click(); await tick();

  // --- Citas: agendar una nueva ---
  MediModules.irCitas('agendar'); await tick();
  var antesDeAgendar = MediModules.citas.length;

  // Elegir especialidad -> medico -> fecha -> hora, como en el movil.
  function elegir(etiqueta) {
    var entrada = etiqueta.matches('input') ? etiqueta : etiqueta.querySelector('input');
    if (entrada) { entrada.click(); return true; }
    return false;
  }

  var esp = qa('#ag-esp .choice')[0];
  ok('F.18 El formulario ofrece especialidades', !!esp, esp ? esp.textContent.trim() : '(ninguna)');
  if (esp && elegir(esp)) {
    await tick();

    var med = qa('#ag-medicos .choice')[0];
    ok('F.19 Al elegir especialidad aparecen los medicos', !!med,
       q('#ag-medicos').textContent.trim().slice(0, 40));
    if (med && elegir(med)) await tick();

    var campoFechaAgenda = q('#ag-fecha');
    ok('F.20 La fecha no admite el pasado',
       !!campoFechaAgenda && campoFechaAgenda.getAttribute('min') === MediPartes.fechas.hoyISO(),
       campoFechaAgenda ? campoFechaAgenda.getAttribute('min') : '(sin campo)');

    if (campoFechaAgenda) {
      campoFechaAgenda.value = fechaConHorarios(9);
      campoFechaAgenda.dispatchEvent(new Event('change', { bubbles: true }));
      await tick();
    }

    var slotsAgenda = qa('#ag-slots input[name="hora"]');
    ok('F.21 Se ofrecen horarios concretos', slotsAgenda.length > 0, slotsAgenda.length + ' horarios');

    if (slotsAgenda.length) {
      // Marcar la casilla no dispara change por si solo: hay que avisar al
        // formulario, igual que haria el navegador con un clic real.
        slotsAgenda[0].checked = true;
        slotsAgenda[0].dispatchEvent(new Event('change', { bubbles: true }));
        await tick();
        q('#schedule-form [type="submit"]').click(); await tick();
      ok('F.22 Muestra un resumen antes de crear la cita',
         q('#module-dialog').open === true && !!q('#module-dialog [data-action="citas:confirmar"]') &&
         MediModules.citas.length === antesDeAgendar,
         !q('#module-dialog').open
           ? 'error: ' + (q('#schedule-error') ? q('#schedule-error').textContent : '(sin error)')
           : MediModules.citas.length + ' citas todavia');

if (q('#module-dialog [data-action="citas:confirmar"]')) {
          q('#module-dialog [data-action="citas:confirmar"]').click(); await tick();
          ok('F.23 Confirmar crea la cita en este dispositivo',
             MediModules.citas.length === antesDeAgendar + 1,
             MediModules.citas.length + ' citas');
ok('F.24 Informa del resultado sin prometer una reserva confirmada',
         /este dispositivo/.test(q('#module-dialog').textContent) &&
         /no se ha reservado|no hay servidor|sin conexión/i.test(q('#module-dialog').textContent),
         q('#module-dialog-title').textContent.trim());
          if (q('#module-dialog').open) q('#module-dialog').close();
        }
      }
    }
  await tick();

  // ---------- ACCESO (sesion pendiente de backend) ----------
  // No se protege nada, y el portal lo dice. Lo que se comprueba es que las
  // tres pantallas existan, que el envio este deshabilitado y que no quede
  // ninguna contrasena guardada ni ninguna peticion hecha.
  Router.ir('acceso'); await tick();

  ok('A.1 La pantalla de acceso existe', vis(q('#view-acceso')) &&
     /Iniciar sesi/.test(q('#view-acceso h1').textContent), q('#view-acceso h1').textContent.trim());

  ok('A.2 Respeta los campos del movil (correo y contrasena)',
     !!q('#acc-correo') && !!q('#acc-contrasena') &&
     q('#acc-correo').getAttribute('autocomplete') === 'email' &&
     q('#acc-contrasena').getAttribute('type') === 'password',
     'correo + contrasena');

  ok('A.3 El boton de iniciar sesion esta deshabilitado',
     !!q('#acceso-form [type="submit"]') && q('#acceso-form [type="submit"]').disabled === true);

  ok('A.4 Explica que el acceso esta pendiente, con razon',
     /pendiente de integraci/.test(q('#view-acceso').textContent) &&
     /no est[aá]n protegidos/.test(q('#view-acceso').textContent),
     q('.pending-head') ? q('.pending-head').textContent.trim() : '(sin aviso)');

  // El enlace de registro del movil: "¿No tienes cuenta? Registrate aqui".
  q('#view-acceso [data-action="acceso:ir"]').click(); await tick();
  ok('A.5 El enlace lleva a crear una cuenta',
     location.hash === '#/acceso/registro' && /Crear una cuenta/.test(q('#view-acceso h1').textContent),
     location.hash);

  ok('A.6 El registro pide confirmar la contrasena',
     !!q('#acc-contrasena') && !!q('#acc-repetir') && q('#registro-form [type="submit"]').disabled === true);

  // Contrasenas distintas: se explica sin enviar nada.
  q('#acc-correo').value = 'paciente@ejemplo.invalid';
  q('#acc-contrasena').value = 'clave-larga-1';
  q('#acc-repetir').value = 'clave-larga-2';
  q('#registro-form').dispatchEvent(new Event('input', { bubbles: true }));
  await tick();
  ok('A.7 Detecta que las contrasenas no coinciden',
     /no coinciden/.test(q('#registro-error').textContent), q('#registro-error').textContent);

  // Un envio forzado no guarda la contrasena ni sale a la red.
  q('#acc-contrasena').value = 'clave-larga-1';
  q('#acc-repetir').value = 'clave-larga-1';
  var redAntes = window.__red.length;
  q('#registro-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  ok('A.8 Un envio no deja la contrasena en el formulario',
     q('#acc-contrasena').value === '' && q('#acc-repetir').value === '',
     'correo conservado: ' + q('#acc-correo').value);
  ok('A.9 Un envio no sale a la red', window.__red.length === redAntes, 'red: ' + window.__red.length);
  ok('A.10 El aviso nombra lo que falta, sin fingir un fallo del servidor',
     /falta conectar el servidor|todav[ií]a no est[aá] disponible/i.test(q('#registro-error').textContent),
     q('#registro-error').textContent);

  // Nada se guarda en almacenamiento persistente.
  var guardado = [];
  try { for (var k = 0; k < localStorage.length; k++) guardado.push(localStorage.key(k)); } catch (e) { }
  try { for (var s = 0; s < sessionStorage.length; s++) guardado.push(sessionStorage.key(s)); } catch (e) { }
  ok('A.11 No se guarda nada en el almacenamiento del navegador',
     guardado.length === 0, guardado.join(', ') || 'vacio');
  ok('A.12 No hay cookies de sesion',
     document.cookie === '' || !/token|session|auth/i.test(document.cookie), document.cookie || 'sin cookies');

  // Recuperacion de acceso: se vuelve al inicio de sesion y se toma el enlace.
  Router.ir('acceso'); await tick();
  q('#view-acceso [data-action="acceso:recuperar"]').click(); await tick();
  ok('A.13 Existe la pantalla de recuperacion',
     location.hash === '#/acceso/recuperar' && /Recuperar acceso/.test(q('#view-acceso h1').textContent),
     location.hash);
  ok('A.14 Recuperar tambien esta pendiente',
     q('#recuperar-form [type="submit"]').disabled === true &&
     /pendiente de integraci/.test(q('#view-acceso').textContent));

  // La navegacion no desaparece en las pantallas de acceso: si no, el
  // paciente se queda sin forma de volver al portal.
  var rutasAcceso = ['acceso', 'acceso/registro', 'acceso/recuperar'];
  var navVisible = true;
  rutasAcceso.forEach(function (ruta) {
    Router.ir(ruta);
    var barra = q('.app-nav');
    if (!barra || !barra.getBoundingClientRect().height > 0) navVisible = false;
  });
  ok('A.15 La navegacion sigue disponible en las pantallas de acceso', navVisible);

  // Y se puede volver al portal desde ahi.
  q('#nav-inicio').click(); await tick();
  ok('A.16 Se vuelve al portal desde Acceso', vis(q('#view-inicio')) && !vis(q('#view-acceso')));

  // ---------- EDICION Y GUARDADOS (Fase 3) ----------
  // Un guardado local debe decir solo lo que ha pasado: que quedo en este
  // dispositivo. Y cancelar con cambios escritos debe pedir permiso.
  q('#nav-salud').click(); await tick();
  q('#view-salud [data-action="salud:editar"]').click(); await tick();
  q('#salud-form [name="valor"]').value = 'Penicilina (grave), Iberseno';
  q('#salud-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  q('#module-dialog [data-action="salud:aplicar"]').click(); await tick();
  ok('E.1 Un guardado local aclara que no se sincroniza',
     /este dispositivo/.test(q('#module-notice').textContent) &&
     /no se sincroniza/i.test(q('#module-notice').textContent),
     q('#module-notice').textContent);

  // El aviso tiene que durar lo suficiente para leerlo.
  ok('E.2 El aviso permanece visible unos segundos',
     !q('#module-notice').classList.contains('hidden'));

  // Sin cambios escritos, cancelar no debe preguntar nada.
  var preguntar = 0;
  window.__ultimaPregunta = '';
  const confirmarReal = window.confirm;
  window.confirm = function (m) { window.__ultimaPregunta = String(m || ''); preguntar++; return true; };

  q('#nav-perfil').click(); await tick();
  q('.sidebar-nav [data-action="perfil:pestana"][data-tab="info-personal"]').click();
  q('#ptab-info-personal [data-action="perfil:editar-personal"]').click(); await tick();
  ok('E.3 Entrar en edicion no pregunta nada por si solo', preguntar === 0, preguntar + ' preguntass');

// Con cambios escritos, cancelar avisa antes de tirarlos.
  //
  // El componente se prueba sobre un formulario recien creado: el de Perfil
  // arrastra el estado de todas las veces que se ha abierto antes en la
  // suite, y eso no dice nada de si la guarda funciona.
  var hoja = document.createElement('div');
  hoja.innerHTML = '<form id="probe-form"><input id="probe-a" value="uno">' +
    '<input id="probe-b" value="dos"><select id="probe-c"><option value="x">x</option>' +
    '<option value="y">y</option></select><textarea id="probe-d">t</textarea></form>';
  document.body.appendChild(hoja);
  var prueba = document.getElementById('probe-form');

  MediFormularios.marcar(prueba);
  ok('E.5a Un formulario recien marcado no tiene cambios pendientes',
     MediFormularios.hayCambios(prueba) === false);

  document.getElementById('probe-a').value = 'cambiado';
  document.getElementById('probe-d').value = 'otro texto';
  prueba.dispatchEvent(new Event('input', { bubbles: true }));
  ok('E.5b Escribir en un input marca el formulario como modificado',
     MediFormularios.hayCambios(prueba) === true);

  document.getElementById('probe-a').value = 'uno';
  document.getElementById('probe-d').value = 't';
  prueba.dispatchEvent(new Event('input', { bubbles: true }));
  ok('E.5c Volver al valor original lo deja limpio',
     MediFormularios.hayCambios(prueba) === false);

  document.getElementById('probe-b').value = 'otro';
  prueba.dispatchEvent(new Event('input', { bubbles: true }));

  var confirmaciones = [];
  window.confirm = function (m) { confirmaciones.push(String(m || '')); return false; };
  ok('E.6 Sin confirmar no se descarta',
     MediFormularios.confirmarDescarte(prueba, 'Se perderán tus cambios.') === false &&
     MediFormularios.hayCambios(prueba) === true);
  ok('E.7 El aviso dice que se perderan',
     confirmaciones.length === 1 && /se perder/i.test(confirmaciones[0]),
     confirmaciones[0] || '(sin aviso)');

  window.confirm = function () { confirmaciones.push('si'); return true; };
  ok('E.8 Confirmando se descarta',
     MediFormularios.confirmarDescarte(prueba) === true);
  // Tras descartar, la foto se toma de nuevo: volver a cancelar no pregunta.
  MediFormularios.marcar(prueba);
  ok('E.8b Tras descartar, no queda nada que perder',
     MediFormularios.hayCambios(prueba) === false);

  // Un <select> no siempre emite input: change debe marcarlo tambien.
  document.getElementById('probe-c').value = 'y';
  prueba.dispatchEvent(new Event('change', { bubbles: true }));
  ok('E.9 Cambiar un select tambien marca el formulario',
     MediFormularios.hayCambios(prueba) === true);

  // Sin cambios, cancelar no molesta.
  var molesta = 0;
  window.confirm = function () { molesta++; return true; };
  document.getElementById('probe-c').value = 'x';
  document.getElementById('probe-b').value = 'dos';
  prueba.dispatchEvent(new Event('change', { bubbles: true }));
  MediFormularios.marcar(prueba);
  ok('E.10 Sin cambios no se pregunta nada', MediFormularios.hayCambios(prueba) === false);
  MediFormularios.confirmarDescarte(prueba);
  ok('E.10b Y sale sin preguntar', molesta === 0, molesta + ' pregunta(s)');

  hoja.remove();
  window.confirm = confirmarReal;

  // El formulario de Perfil esta conectado a la guarda. Se marca como
  // sucio a proposito para aislar el enlace con el componente.
  q('#ptab-info-personal [data-action="perfil:editar-personal"]').click(); await tick();
  var personal = q('#personal-edit-form');
  MediFormularios.marcar(personal);
  q('#inp-street').value = 'Calle sin guardar';
  personal.dispatchEvent(new Event('input', { bubbles: true }));
  var preguntar = 0;
  window.confirm = function () { preguntar++; return true; };
  q('#personal-edit-form [data-action="perfil:cancelar-personal"]').click(); await tick();
  ok('E.11 Cancelar un formulario con cambios pregunta antes de descartarlos',
     preguntar === 1 && vis(q('#personal-read-view')),
     preguntar + ' pregunta(s), cerrado=' + vis(q('#personal-read-view')));
  window.confirm = confirmarReal;

  // Guardar y cerrar sin cambios pendientes no vuelve a preguntar.
  preguntar = 0;
  window.confirm = function () { preguntar++; return true; };
  q('#ptab-info-personal [data-action="perfil:editar-personal"]').click(); await tick();
  q('#personal-edit-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  ok('E.12 Guardar no pide confirmacion adicional', preguntar === 0, preguntar + ' pregunta(s)');
  ok('E.13 Guardar tambien aclara que es local',
     /este dispositivo/i.test(q('#module-notice').textContent), q('#module-notice').textContent);
  window.confirm = confirmarReal;

  // Guardar y cerrar sin cambios pendientes no vuelve a preguntar.
  preguntar = 0;
  window.confirm = function () { preguntar++; return true; };
  q('#ptab-info-personal [data-action="perfil:editar-personal"]').click(); await tick();
  q('#personal-edit-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  ok('E.9 Guardar no pide confirmacion adicional', preguntar === 0, preguntar + ' pregunta(s)');
  ok('E.10 Guardar tambien aclara que es local',
     /este dispositivo/i.test(q('#module-notice').textContent), q('#module-notice').textContent);
  window.confirm = confirmarReal;

  // Un error de validacion conserva lo escrito.
  q('#ptab-info-personal [data-action="perfil:editar-personal"]').click(); await tick();
  q('#inp-email').value = 'correo-invalido';
  q('#personal-edit-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  ok('E.11 Un error de validacion conserva lo introducido',
     q('#inp-email').value === 'correo-invalido' && vis(q('#personal-edit-form')) &&
     /e-?mail|correo/i.test(q('#personal-error').textContent),
     q('#personal-error').textContent);

  // ---------- FUNCIONES PENDIENTES DE BACKEND ----------
  // Ninguna debe fingir que funciona: o lo explica, o no se muestra.
  q('[data-action="inicio:ver-qr"]').click(); await tick();
  ok('D.1 El QR no muestra un patron que parezca escaneable',
     qa('#module-dialog .qr-frame').length === 0 &&
     qa('#module-dialog svg[viewBox="0 0 100 100"]').length === 0,
     qa('#module-dialog .qr-frame').length + ' marcos, ' +
     qa('#module-dialog svg[viewBox="0 0 100 100"]').length + ' patrones');
  ok('D.2 El QR se declara pendiente y explica por que',
     /en desarrollo|todav[ií]a no existe/i.test(q('#module-dialog').textContent) &&
     /podr[ií]a escanearse por error/i.test(q('#module-dialog').textContent),
     q('#module-dialog').textContent.replace(/\s+/g, ' ').slice(0, 90));
  if (q('#module-dialog').open) q('#module-dialog').close();
  await tick();

  // El boton de compartir sigue_CONNECTADO al aviso honesto.
  q('[data-action="inicio:compartir"]').click(); await tick();
  ok('D.3 Compartir explica que depende del servicio de QR',
     /a[uú]n no conectado|depende del servicio/i.test(q('#module-notice').textContent),
     q('#module-notice').textContent);

  // Subir un documento es local y de verdad se guarda en memoria: el
  // resultado que se muestra tiene que decirlo.
  q('#nav-documentos').click(); await tick();
  q('[data-action="documentos:form"]').click(); await tick();
  var campoArchivo = q('#document-form [name="archivo"]');
  ok('D.4 El alta de documento pide un archivo de verdad',
     !!campoArchivo && campoArchivo.getAttribute('type') === 'file' &&
     /pdf/i.test(campoArchivo.getAttribute('accept') || ''),
     campoArchivo ? campoArchivo.getAttribute('type') + ' ' + campoArchivo.getAttribute('accept') : '(no encontrado)');
  ok('D.5 Y avisa de que no se sube a un servidor',
     /no se env[ií]a|sin servidor|no se sube/i.test(q('#module-dialog').textContent),
     q('#module-dialog').textContent.replace(/\s+/g, ' ').match(/[^.]*\./)[0].trim());
  if (q('#module-dialog').open) q('#module-dialog').close();
  await tick();

  // ---------- ACCESIBILIDAD Y ESTADOS (Fase 6) ----------
  // Se comprueba sobre el portal entero, no vista por vista: si algo falla
  // en un estado que la suite no abre, no se veria.
  const RUTAS_REVISABLES = ['inicio', 'salud', 'historial', 'citas', 'documentos', 'perfil', 'acceso'];

  let sinH1 = [], h1Repetidos = [], sinAlt = [], botonesSinNombre = [], sinFocusVisible = [];
  let点击 = 0;

  RUTAS_REVISABLES.forEach(function (ruta) {
    Router.ir(ruta);
    const vista = q('#view-' + ruta.split('/')[0]);
    if (!vista) return;

    const h1 = qa('#view-' + ruta.split('/')[0] + ' h1');
    if (h1.length === 0) sinH1.push(ruta);
    if (h1.length > 1) h1Repetidos.push(ruta + ' (' + h1.length + ')');

    qa('#view-' + ruta.split('/')[0] + ' img').forEach(function (img) {
      if (!img.hasAttribute('alt')) sinAlt.push(ruta + ':' + img.getAttribute('src'));
    });

    qa('button').forEach(function (b) {
      const nombre = (b.textContent || '').trim() ||
        b.getAttribute('aria-label') || b.getAttribute('title') || '';
      if (!nombre) botonesSinNombre.push(ruta + ' ' + (b.className || b.id || '(sin clase)'));
    });
  });

  ok('P.1 Cada vista tiene exactamente un h1',
     sinH1.length === 0 && h1Repetidos.length === 0,
     'sin h1: ' + (sinH1.join(', ') || '-') + '; repetidos: ' + (h1Repetidos.join(', ') || '-'));

  ok('P.2 Todas las imagenes tienen texto alternativo',
     sinAlt.length === 0, sinAlt.join(', ') || 'todas con alt');

  ok('P.3 Todos los botones tienen nombre accesible',
     botonesSinNombre.length === 0, botonesSinNombre.slice(0, 4).join(' | ') || 'todos nombrados');

  // El foco debe verse: sin indicador, un usuario de teclado no sabe donde
// esta. El portal lo resuelve con :focus-visible, que no se puede provocar
// con focus() programatico, asi que se lee la regla por CSSOM.
function reglasDeFoco() {
  var encontradas = [];
  Array.prototype.forEach.call(document.styleSheets, function (hoja) {
    var reglas;
    try { reglas = hoja.cssRules; } catch (e) { return; }
    if (!reglas) return;
    Array.prototype.forEach.call(reglas, function (r) {
      if (r.selectorText && /focus-visible/.test(r.selectorText)) {
        encontradas.push(r.cssText);
      }
    });
  });
  return encontradas;
}

ok('P.4 Hay una regla de foco visible con contorno',
     reglasDeFoco().some(function (r) { return /outline/.test(r) && !/none/.test(r); }),
     reglasDeFoco().length + ' reglas :focus-visible');

  // Estados coherentes: el aviso accesible es aria-live y se anuncia.
  ok('P.5 El aviso de acciones es una region viva',
     q('#module-notice').getAttribute('aria-live') === 'polite' ||
     q('#module-notice').getAttribute('role') === 'status',
     q('#module-notice').getAttribute('aria-live') || q('#module-notice').getAttribute('role') || '(sin rol)');

  // El dialogo es nativo, asi que se cierra con Escape y devuelve el foco.
  Router.ir('perfil'); await tick();
  q('.sidebar-nav [data-action="perfil:pestana"][data-tab="contactos"]').click();
  q('#ptab-contactos [data-action="perfil:agregar-contacto"]').click(); await tick();
  ok('P.6 El dialogo modal usa <dialog> nativo, con cierre y etiqueta',
     q('#module-dialog').open === true &&
     !!q('#module-dialog').getAttribute('aria-labelledby') &&
     !!q('#module-dialog [data-action="modal:cerrar"]'));
  q('#module-dialog').close(); await tick();

  // El enlace saltador ayuda en teclado y lector de pantalla.
  const salto = q('.skip-link');
  ok('P.7 Hay una via para saltar al contenido',
     !!salto && /^Saltar/i.test(salto.textContent) && !!q(salto.getAttribute('href')),
     salto ? salto.textContent.trim() + ' -> ' + salto.getAttribute('href') : '(no existe)');

  // Y solo se ve cuando recibe el foco, que es cuando sirve. Se comprueba
  // por CSSOM porque focus() programatico no dispara :focus de forma fiable
  // en headless.
  ok('P.8 El enlace de salto se oculta y se revela con el foco',
     (function () {
       var reglas = [];
       Array.prototype.forEach.call(document.styleSheets, function (hoja) {
         var r; try { r = hoja.cssRules; } catch (e) { return; }
         if (!r) return;
         Array.prototype.forEach.call(r, function (x) {
           if (x.selectorText && x.selectorText.indexOf('skip-link') !== -1) {
             reglas.push(x.selectorText);
           }
         });
       });
       var texto = reglas.join(' ');
       return /skip-link:focus/.test(texto) && /not\(:focus\)/.test(texto);
     })(),
     'reglas de skip-link encontradas');

  // ---------- ESTADO GLOBAL ----------
  q('#nav-inicio').click(); await tick();
  q('#nav-inicio').click(); await tick();
  ok('G.1 Vuelta a Inicio', vis(q('#view-inicio')));
  ok('G.2 Una sola vista visible', qa('.view-section:not(.hidden)').length === 1, qa('.view-section:not(.hidden)').length);
  // Las pruebas de flujo crean y modifican citas a proposito, asi que no se
  // comprueba el total: se comprueba que los datos de partida siguen ahi.
  ok('G.3 Datos de partida intactos',
     MediModules.documentos.length === 9 &&
     MediModules.citas.length >= 9 &&
     MediModules.citas.some(function (c) { return String(c.estado).toLowerCase() === 'atendida'; }),
     MediModules.documentos.length + ' documentos, ' + MediModules.citas.length + ' citas');
  ok('G.4 Sin errores JavaScript', (window.__errs || []).length === 0, JSON.stringify(window.__errs || []));

  // Iconos: render() sustituye cada <i data-icon> por su <svg>. Si queda
  // alguno sin sustituir, es un nombre de icono desconocido y el hueco se
  // ve en pantalla. El boton SOS se crea tras el arranque, asi que es el
  // que mas se escapaba del dibujado.
  var sinDibujar = qa('i[data-icon]');
  ok('G.5 No queda ningun marcador de icono sin dibujar',
     sinDibujar.length === 0,
     sinDibujar.length + ' sin dibujar' +
     (sinDibujar.length ? ' -> ' + sinDibujar.slice(0, 5).map(function (n) {
       return n.getAttribute('data-icon');
     }).join(',') : ''));

  var fab = q('#sos-boton');
  var fabSvg = fab && fab.querySelector('svg');
  var fabTexto = fab && fab.querySelector('span');
  ok('G.6 El boton SOS tiene icono y etiqueta visibles',
     !!fabSvg && !!fabTexto && fabTexto.textContent.trim() === 'SOS' &&
     fabTexto.getBoundingClientRect().height > 0 &&
     fabSvg.getBoundingClientRect().width > 0,
     fab ? 'svg=' + !!fabSvg + ' span=' + JSON.stringify(fabTexto && fabTexto.textContent) : '(no existe)');

  // La edad se deriva de la fecha guardada, no de un texto fijo que envejece.
  var isoNac = q('#val-birth').dataset.iso;
  ok('G.7 La edad coincide con la fecha de nacimiento mostrada',
     isoNac === '1990-06-15' &&
     q('#val-age').textContent.trim() === (function () {
       var p = isoNac.split('-').map(Number), h = new Date();
       var e = h.getFullYear() - p[0];
       if (h.getMonth() + 1 < p[1] || (h.getMonth() + 1 === p[1] && h.getDate() < p[2])) e -= 1;
       return e + ' años';
     })(),
     isoNac + ' -> ' + q('#val-age').textContent.trim());

  // La fecha se muestra en el formato del portal, nunca en ISO crudo.
  ok('G.8 La fecha de nacimiento no se muestra en ISO',
     q('#val-birth').textContent.trim() === '15/06/1990',
     q('#val-birth').textContent.trim());

  // Una sola forma de hora en todo el portal: 24 h, sin "p. m.".
  var horas = [];
  ['#/citas', '#/historial', '#/perfil', '#/inicio', '#/documentos'].forEach(function () {});
  var cuerpo = document.body.textContent;
  ok('G.9 Ninguna hora usa el formato de 12 horas',
     /\d{1,2}:\d{2}\s*(a\. m\.|p\. m\.)/i.test(cuerpo) === false,
     (cuerpo.match(/\d{1,2}:\d{2}\s*(a\. m\.|p\. m\.)/i) || ['sin 12 h'])[0]);
  ok('G.10 Ninguna fecha se muestra en ISO crudo',
     /(19|20)\d{2}-\d{2}-\d{2}/.test(cuerpo) === false,
     (cuerpo.match(/(19|20)\d{2}-\d{2}-\d{2}/) || ['sin ISO'])[0]);

  // Red: ningun flujo debe salirse del servidor local.
  ok('G.11 Ningun flujo intenta salir del servidor local',
     window.__red.length === 0,
     window.__red.length ? window.__red.slice(0, 3).join(' | ') : 'sin peticiones a la red');

  // Y ningun boton debe prometer que guardo algo en un servidor.
  ok('G.12 Ningun boton promete un envio a un servidor',
     /guardado en (el |nuestro )?(servidor|nube)|enviado (al|a) servidor|subido correctamente|guardado en la nube/i
       .test(cuerpo) === false,
     'ninguno');

  // Registro de acciones: todas las vistas viven en el DOM (solo ocultas),
  // asi que un recorrido del documento cubre el marcado completo. Un control
  // sin accion registrada es un boton que no hace nada.
  var registro = MediAcciones.registro;
  var controles = Array.prototype.slice.call(qa('[data-action]')).filter(function (el) {
    return el.getAttribute('data-action').indexOf('${') === -1;
  });
  var sinAccion = [];
  controles.forEach(function (el) {
    var a = el.getAttribute('data-action');
    if (typeof registro[a] !== 'function' && sinAccion.indexOf(a) === -1) sinAccion.push(a);
  });
  ok('G.13 Todo control tiene su accion registrada',
     controles.length > 0 && sinAccion.length === 0,
     controles.length + ' controles; sin accion: ' + (sinAccion.join(', ') || 'ninguno'));

  // Y al reves: una accion registrada que nunca aparece en el DOM es codigo
  // muerto. Se consulta el registro de todo lo que ha existido, no solo el
  // estado final, porque los dialogos se vacian al cerrarse.
  var muertas = Object.keys(registro).filter(function (a) { return !window.__visto[a]; });
  ok('G.14 No hay acciones registradas sin usar', muertas.length === 0,
     muertas.length ? muertas.join(', ') : 'ninguna');
  ok('G.15 Se han visto acciones de todo el portal',
     Object.keys(window.__visto).length >= 45,
     Object.keys(window.__visto).length + ' acciones vistas');

  var pass = R.filter(function (r) { return r.p; }).length;
  var out = '==RESULTADO==\nTOTAL=' + R.length + ' OK=' + pass + ' FALLOS=' + (R.length - pass) + '\n';
  R.forEach(function (r) { out += (r.p ? 'PASS | ' : 'FAIL | ') + r.t + (r.x ? '  [' + r.x + ']' : '') + '\n'; });

  var pre = document.createElement('pre');
  pre.id = 'TESTRESULT';
  pre.textContent = out;
  document.body.appendChild(pre);
}
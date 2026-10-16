// Captura las ocho vistas en movil, tablet y escritorio para revisarlas a ojo.
// No es parte de la suite: es la herramienta de inspeccion visual.
//
// Importante: --window-size no baja de ~492 px en Windows, asi que una
// captura directa a 390 px sale recortada y hace creer que la pagina se
// desborda. Para que la imagen sea fiel, la app se renderiza dentro de un
// iframe del ancho exacto y se captura esa pagina marco.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.env.PORT || 8801);
const SALIDA = path.join(__dirname, '..', '.capturas');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json'
};

const VISTAS = ['inicio', 'salud', 'historial', 'citas', 'documentos', 'perfil', 'acceso', 'onboarding'];
const VENTANAS = [
  { nombre: 'movil', w: 390, h: 1500 },
  { nombre: 'tablet', w: 768, h: 1300 },
  { nombre: 'escritorio', w: 1400, h: 1100 }
];

function buscarNavegador() {
  if (process.env.BROWSER) return process.env.BROWSER;
  const rutas = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const r of rutas) if (fs.existsSync(r)) return r;
  return null;
}

function servir() {
  return new Promise((resolve) => {
    const servidor = http.createServer((req, res) => {
      const url = req.url.split('?')[0];

      // Marco de captura: el iframe fija el ancho real del layout.
      if (url === '/__captura__') {
        const q = new URLSearchParams(req.url.split('?')[1] || '');
        const w = Number(q.get('w')) || 390;
        const h = Number(q.get('h')) || 1500;
        res.writeHead(200, { 'Content-Type': TIPOS['.html'] });
        res.end(`<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#0b1020;overflow:hidden}
iframe{display:block;border:0;width:${w}px;height:${h}px}
</style></head><body>
<iframe id="f" src="/?captura=1#/${q.get('v') || 'inicio'}"></iframe>
  <span id="ESTADO" style="display:none">ESPERANDO</span>
  <div id="PENDIENTE" style="background:#b00020;color:#fff;font:700 13px sans-serif;padding:6px">ESPERANDO ${q.get('v') || 'inicio'}</div>
  <script>
// El portal exige sesion de demostracion, asi que sin ella toda captura
// saldria de la pantalla de acceso. Se abre una sesion en memoria dentro
// del iframe y se pide la ruta que se quiere retratar. Lo hace el marco de
// captura, no la aplicacion: la app no gana ninguna puerta trasera.
//
// Se espera a que la vista pedida este de verdad en pantalla antes de dar
// la captura por buena. Antes se usaban con dos retardos fijos, y se
// perdia la carrera con la redireccion al acceso: la imagen salia con el
// contenido ya pintado pero a medio camino.
//
// Aqui se comprueba una condicion, no un reloj: que la vista pedida sea la
// visible y que la barra de navegacion se vea cuando la vista no es de
// acceso. Si no se cumple, se reintenta y, mientras tanto, la imagen lleva
// arriba un aviso rojo para que una captura incompleta no pase por buena.
//
// AVISO al leer estas imagenes: en las capturas la barra inferior fija no
// sale, y no es un fallo del portal. Se comprobo: dentro del iframe la
// barra esta en pantalla (display flex, caja de 375x65 pegada al borde
// inferior y cinco enlaces visibles) y elementFromPoint devuelve elementos
// suyos en todo el ancho, o sea que esta encima y se puede pulsar. Es el
// volcado a PNG del navegador sin interfaz, con la barra dentro de un
// iframe, lo que no la pinta. La comprobacion automatica de la barra vive
// en tests/run.js, que si la mide sobre la pagina real.
var RUTA = ${JSON.stringify(q.get('v') || 'inicio')};
var vistaDeAcceso = RUTA === 'acceso' || RUTA === 'onboarding';
var intentos = 0;

function barraVisible(doc) {
  var nav = doc.querySelector('.app-nav');
  if (!nav) return false;
  var cs = doc.defaultView.getComputedStyle(nav);
  var r = nav.getBoundingClientRect();
  return cs.display !== 'none' && cs.visibility !== 'hidden' &&
    r.height > 0 && r.width > 0;
}

function listo(doc) {
  if (!doc || !doc.body) return false;
  var visible = doc.querySelector('.view-section:not(.hidden)');
  var vista = visible ? visible.id : '';
  var esLaMia = vista === 'view-' + RUTA ||
    (RUTA === 'citas' && vista === 'view-citas') ||
    (RUTA === 'documentos' && vista === 'view-documentos');
  if (!esLaMia) return false;
  // En el acceso la barra tiene que estar oculta a proposito; en el resto del
  // portal tiene que verse, y si no se ve todavia no se ha terminado de pintar.
  return vistaDeAcceso ? !barraVisible(doc) : barraVisible(doc);
}

function intento() {
  intentos++;
  var f = document.getElementById('f');
  try {
    var w = f.contentWindow;
    w.AccesoModulo.sesion.activa = true;
    w.AccesoModulo.sesion.correo = 'demo@ejemplo.invalid';
    w.AccesoModulo.sesion.onboarding = 'hecho';
    w.Router.ir(RUTA);
  } catch (e) {}
  if (listo(f.contentDocument)) {
    document.getElementById('PENDIENTE').style.display = 'none';
    document.getElementById('ESTADO').textContent = 'LISTO intentos=' + intentos;
    return;
  }
  if (intentos > 60) {
    var dd = document.getElementById('f').contentDocument;
    var nav = dd ? dd.querySelector('.app-nav') : null;
    var ns = (nav && dd) ? dd.defaultView.getComputedStyle(nav) : null;
    document.getElementById('ESTADO').textContent =
      'AVISO vista=' + RUTA + ' intentos=' + intentos +
      ' bodyClass=' + (dd && dd.body ? dd.body.className : '?') +
      ' navDisplay=' + (ns ? ns.display : 'sin-nav') +
      ' hash=' + (dd ? dd.location.hash : '?');
    return;
  }
  setTimeout(intento, 60);
}

document.getElementById('f').addEventListener('load', function () {
  setTimeout(intento, 60);
});
  </script>
  </body></html>`);
        return;
      }

      const destino = path.join(RAIZ, url === '/' ? 'index.html' : url);
      if (!destino.startsWith(RAIZ) || !fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
        res.writeHead(404); res.end('no'); return;
      }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(destino)] || 'application/octet-stream' });
      res.end(fs.readFileSync(destino));
    });
    servidor.listen(PUERTO, '127.0.0.1', () => resolve(servidor));
  });
}

function capturar(navegador, url, destino, w, h, etiqueta) {
  return new Promise((resolve) => {
    if (fs.existsSync(destino)) fs.unlinkSync(destino);
    const hijo = spawn(navegador, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      // Perfil propio por captura: reutilizar uno deja al siguiente proceso
      // compitiendo por el bloqueo del perfil y captura antes de que
      // terminen de pintarse los iconos.
      '--user-data-dir=' + path.join(os.tmpdir(), 'mediqr-capt-' + etiqueta),
      '--no-first-run', '--no-default-browser-check',
      // El margen extraabsorbe el minimo que impone el sistema.
      '--window-size=' + (w + 40) + ',' + (h + 40),
      // Margen amplio: con poco presupuesto la captura sale antes de que
      // el MutationObserver de iconos vacie los marcadores y se ven huecos
      // que no existen en el navegador real.
      '--virtual-time-budget=25000',
      '--screenshot=' + destino,
      url
    ], { windowsHide: true });

    const limite = setTimeout(() => { hijo.kill(); }, 35000);
    hijo.on('close', () => {
      clearTimeout(limite);
      resolve(fs.existsSync(destino) && fs.statSync(destino).size > 1000);
    });
  });
}

(async function () {
  const navegador = buscarNavegador();
  if (!navegador) { console.error('Sin navegador. Define BROWSER.'); process.exit(1); }

  fs.mkdirSync(SALIDA, { recursive: true });
  const servidor = await servir();

  for (const v of VENTANAS) {
    for (const vista of VISTAS) {
      const destino = path.join(SALIDA, vista + '-' + v.nombre + '.png');
      const url = `http://127.0.0.1:${PUERTO}/__captura__?w=${v.w}&h=${v.h}&v=${vista}`;
      const ok = await capturar(navegador, url, destino, v.w, v.h, v.nombre + '-' + vista);
      console.log((ok ? '  ok   ' : ' FALLA ') + vista + '-' + v.nombre + '.png');
    }
  }

  servidor.close();
  console.log('\nCapturas en ' + SALIDA);
})();
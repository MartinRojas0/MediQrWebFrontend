// Captura las seis vistas en movil, tablet y escritorio para revisarlas a ojo.
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

const VISTAS = ['inicio', 'salud', 'historial', 'citas', 'documentos', 'perfil'];
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
<iframe src="/?captura=1#/${q.get('v') || 'inicio'}"></iframe>
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
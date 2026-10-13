// ==========================================================
// MediQR - Ejecutor de pruebas funcionales
//
// Levanta un servidor estatico local, inyecta el harness en la pagina
// y ejecuta Microsoft Edge (o Chrome) en modo headless. No requiere
// instalar dependencias: solo modulos nativos de Node.
//
// Uso:   node tests/run.js
//        node tests/run.js /ruta/al/proyecto
//        BROWSER="C:\...\chrome.exe" node tests/run.js
//
// Salida: 0 si todas las comprobaciones pasan, 1 si alguna falla,
//         2 si no se encuentra un navegador compatible.
// ==========================================================
'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const PUERTO = Number(process.env.PORT || 8799);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8'
};

const RUTAS_BROWSER = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

function buscarNavegador() {
  if (process.env.BROWSER) return process.env.BROWSER;
  for (const r of RUTAS_BROWSER) if (fs.existsSync(r)) return r;
  return null;
}

function crearServidor(harness) {
  return http.createServer((req, res) => {
    const ruta = decodeURIComponent(req.url.split('?')[0]);
    // ?caso=X indica al harness que ejecute la comprobacion de enlace
    // directo. El hash viaja despues del ? en la URL real del navegador,
    // de modo que la app resuelve la ruta como en una recarga de verdad.
    const caso = decodeURIComponent((req.url.split('?')[1] || '').replace(/^caso=/, ''));

    if (ruta === '/__test__/harness.js') {
      const buf = Buffer.from(harness, 'utf8');
      res.writeHead(200, {
        'Content-Type': TIPOS['.js'],
        'Content-Length': buf.length,
        'Cache-Control': 'no-store'
      });
      return res.end(buf);
    }

    if (ruta === '/__test__/marco.html') {
      // Marco de medida: la pagina padre mide el iframe y escribe el
      // resultado en su propio DOM, porque --dump-dom solo serializa el
      // documento principal. Asi se pueden comprobar anchos por debajo
      // del minimo que impone --window-size.
      const q = new URLSearchParams(req.url.split('?')[1] || '');
      const w = Number(q.get('w')) || 390;
      const v = q.get('v') || 'inicio';

      const marco = `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0">
<iframe id="f" src="/?sondeo=1#/${v}" width="${w}" height="900" style="border:0"></iframe>
<pre id="MEDIDA"></pre>
<script>
document.getElementById('f').addEventListener('load', function () {
  var f = this;
  setTimeout(function () {
    var doc = f.contentDocument;
    var vp = f.clientWidth;
    var sw = doc.documentElement.scrollWidth;
    var out = ['vp=' + vp, 'sw=' + sw, 'desborde=' + (sw - vp), 'culpables=0'];
    var vistos = {};
    // Un elemento dentro de un contenedor con scroll propio no desborda
    // la pagina: se ignora para no marcar falsos positivos.
    function enScroll(el) {
      for (var p = el.parentElement; p && p !== doc.body; p = p.parentElement) {
        var ov = p.style.overflowX || getComputedStyle(p).overflowX;
        if (ov === 'auto' || ov === 'scroll') return true;
      }
      return false;
    }
    Array.prototype.forEach.call(doc.querySelectorAll('body *'), function (el) {
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= vp + 1) return;
      if (enScroll(el)) return;
      var sel = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
        (typeof el.className === 'string' && el.className.trim()
          ? '.' + el.className.trim().split(/\\s+/)[0] : '');
      if (!vistos[sel]) { vistos[sel] = 1; out.push('culpable ' + sel + ' right=' + Math.round(r.right)); }
    });
    document.getElementById('MEDIDA').textContent = out.join('\\n');
  }, 250);
});
<\/script>
</body></html>`;

      const buf = Buffer.from(marco, 'utf8');
      res.writeHead(200, { 'Content-Type': TIPOS['.html'], 'Content-Length': buf.length, 'Cache-Control': 'no-store' });
      return res.end(buf);
    }

    if (ruta === '/' || ruta === '/index.html') {
      // El harness se sirve como archivo separado, nunca en linea: si se
      // incrustara en el HTML, sus propias cadenas de busqueda pasarian a
      // formar parte del DOM que las comprobaciones inspeccionan.
      const prefijo = caso ? `<script>window.__CASO=${JSON.stringify(caso)};</script>\n` : '';
      const html = fs
        .readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
        .replace('</body>', `  ${prefijo}<script src="/__test__/harness.js"></script>\n</body>`);
      const buf = Buffer.from(html, 'utf8');
      res.writeHead(200, {
        'Content-Type': TIPOS['.html'],
        'Content-Length': buf.length,
        'Cache-Control': 'no-store'
      });
      return res.end(buf);
    }

    const destino = path.join(RAIZ, ruta);
    if (!destino.startsWith(RAIZ) || !fs.existsSync(destino) || !fs.statSync(destino).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('no encontrado');
    }
    const buf = fs.readFileSync(destino);
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(destino)] || 'application/octet-stream',
      'Content-Length': buf.length,
      'Cache-Control': 'no-store'
    });
    res.end(buf);
  });
}

// Ejecuta el navegador y devuelve el DOM volcado por --dump-dom.
// Se usa spawn (asincrono) y no spawnSync porque los ejecutables graficos de
// Windows no respeutan la espera sincrona de Node.
// Tercera pasada: cada vista dentro de un marco de ancho fijo, para
// detectar desbordamiento horizontal. --window-sizeno baja de 492 px,
// asi que la medicion se hace con iframes de ancho exacto.
const VISTAS_RESPONSIVE = ['inicio', 'salud', 'historial', 'citas', 'documentos', 'perfil'];
const ANCHOS = [360, 390, 430, 540, 768, 1024, 1440];

function medir(navegador, url) {
  return new Promise((resolve) => {
    const hijo = spawn(navegador, [
      '--headless', '--disable-gpu', '--no-sandbox',
      '--user-data-dir=' + path.join(os.tmpdir(), 'mediqr-test-marco'),
      '--no-first-run', '--no-default-browser-check',
      '--window-size=1600,1000',
      '--virtual-time-budget=12000',
      '--dump-dom', url
    ], { windowsHide: true });

    let salida = '';
    let terminado = false;
    hijo.stdout.on('data', (d) => { salida += d.toString('utf8'); });
    const limite = setTimeout(() => { if (!terminado) { hijo.kill(); resolve(''); } }, 40000);
    hijo.on('close', () => { terminado = true; clearTimeout(limite); resolve(salida); });
  });
}

async function faseResponsive(navegador) {
  console.log('\n--- responsive: sin desbordamiento horizontal ---');
  let fallos = 0;

  for (const v of VISTAS_RESPONSIVE) {
    const linea = [];

    for (const w of ANCHOS) {
      const dom = await medir(navegador, `http://127.0.0.1:${PUERTO}/__test__/marco.html?w=${w}&v=${v}`);
      const m = dom.match(/id="MEDIDA">([\s\S]*?)<\/pre>/);

      if (!m) { linea.push(w + ':?'); fallos++; continue; }

      const texto = m[1].replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
      const desborde = Number((/desborde=(-?\d+)/.exec(texto) || [])[1] || 99);
      // Ojo: la cabecera es 'culpables=0'; los culpables reales empiezan por 'culpable ' con espacio.
      const culpables = texto.split('\n').filter((l) => l.startsWith('culpable '));

      if (desborde > 1 || culpables.length > 0) {
        fallos++;
        linea.push(w + ':DESBORDA');
        culpables.slice(0, 3).forEach((c) => console.log('        ' + v + ' ' + w + 'px -> ' + c));
      } else {
        linea.push(String(w));
      }
    }
    console.log('  ' + (linea.every((s) => /^\d+$/.test(s)) ? ' OK  ' : 'FALLA') + '  ' + v.padEnd(12) + linea.join(' '));
  }

  return fallos;
}
// como ocurriria al recargar con la URL ya escrita.
const RUTAS_DIRECTAS = [
  'inicio', 'salud', 'historial', 'perfil', 'citas/agendar', 'citas/historial',
  'documentos/todos', 'documentos/recetas', 'documentos/examenes',
  'ruta-inexistente'
];

function ejecutarURL(navegador, url) {
  return new Promise((resolve, reject) => {
    const perfil = path.join(os.tmpdir(), 'mediqr-test-profile');
    const hijo = spawn(navegador, [
      '--headless', '--disable-gpu', '--no-sandbox',
      '--user-data-dir=' + perfil,
      '--no-first-run', '--no-default-browser-check',
      '--virtual-time-budget=20000',
      '--dump-dom', url
    ], { windowsHide: true });

    let salida = '';
    let terminado = false;

    hijo.stdout.on('data', (d) => { salida += d.toString('utf8'); });
    hijo.on('error', reject);

    const limite = setTimeout(() => {
      if (!terminado) { hijo.kill(); reject(new Error('El navegador supero el tiempo limite de 90 s.')); }
    }, 90000);

    hijo.on('close', () => {
      terminado = true;
      clearTimeout(limite);
      resolve(salida);
    });
  });
}

function extraer(salida) {
  const m = salida.match(/id="TESTRESULT">([\s\S]*?)<\/pre>/);
  if (!m) return null;
  return m[1]
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

(async function main() {
  const navegador = buscarNavegador();
  if (!navegador) {
    console.error('No se encontro Microsoft Edge ni Google Chrome.');
    console.error('Define la variable de entorno BROWSER con la ruta al ejecutable, por ejemplo:');
    console.error('  set BROWSER=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
    process.exit(2);
  }

  if (!fs.existsSync(path.join(RAIZ, 'index.html'))) {
    console.error('No se encontro index.html en ' + RAIZ);
    process.exit(2);
  }

  const harness = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8');
  const servidor = crearServidor(harness);

  await new Promise((r) => servidor.listen(PUERTO, '127.0.0.1', r));
  console.log('Servidor de pruebas en http://127.0.0.1:' + PUERTO + '/  (raiz: ' + RAIZ + ')');
  console.log('Navegador: ' + navegador + '\n');

  let salida;
  try {
    salida = await ejecutarURL(navegador, 'http://127.0.0.1:' + PUERTO + '/');
  } catch (e) {
    servidor.close();
    console.error('Error al ejecutar el navegador: ' + e.message);
    process.exit(1);
  }

  const texto = extraer(salida);
  if (texto === null) {
    servidor.close();
    console.error('El harness no produjo resultado. Revisa que el sitio compile en el navegador.');
    process.exit(1);
  }

  console.log(texto);

  // Segunda pasada: abrir el portal directamente en cada ruta, como
  // ocurriria al recargar con la URL ya escrita.
  let fallosDirectos = 0;
  console.log('\n--- enlaces directos (recarga con la URL escrita) ---');

  for (const ruta of RUTAS_DIRECTAS) {
    let dom;
    try {
      dom = await ejecutarURL(navegador, 'http://127.0.0.1:' + PUERTO + '/?caso=' + encodeURIComponent(ruta) + '#/' + ruta);
    } catch (e) {
      console.error('  ' + ruta.padEnd(20) + ' ERROR: ' + e.message);
      fallosDirectos++;
      continue;
    }

    const textoRuta = extraer(dom);
    if (textoRuta === null) {
      console.error('  ' + ruta.padEnd(20) + ' sin resultado');
      fallosDirectos++;
      continue;
    }

    const resumen = (textoRuta.match(/TOTAL=\d+ OK=\d+ FALLOS=\d+/) || ['?'])[0];
    const falla = /FAIL \||HARNESS ERROR/.test(textoRuta);
    if (falla) fallosDirectos++;
    console.log('  ' + (falla ? 'FALLA' : ' OK  ') + '  ' + ruta.padEnd(20) + resumen);

    if (falla) {
      textoRuta.split('\n').filter((l) => /FAIL \||HARNESS ERROR/.test(l)).forEach((l) => console.log('        ' + l));
    }
  }

  const fallosResponsive = await faseResponsive(navegador);

  servidor.close();

  if (/HARNESS ERROR/.test(texto)) process.exit(1);
  if (/FAIL \|/.test(texto) || fallosDirectos > 0 || fallosResponsive > 0) process.exit(1);
  process.exit(0);
})();
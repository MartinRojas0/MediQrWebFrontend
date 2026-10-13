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
// Rutas que se comprueban abriendo el portal directamente en ellas,
// como ocurriria al recargar con la URL ya escrita.
const RUTAS_DIRECTAS = [
  'inicio', 'perfil', 'citas/agendar', 'citas/historial',
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

  servidor.close();

  if (/HARNESS ERROR/.test(texto)) process.exit(1);
  if (/FAIL \|/.test(texto) || fallosDirectos > 0) process.exit(1);
  process.exit(0);
})();
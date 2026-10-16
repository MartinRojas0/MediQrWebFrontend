# MediQR — Portal del paciente (frontend)

Frontend web del portal de pacientes de MediQR. Es un sitio estático de
**HTML, CSS y JavaScript plano**: no hay framework, ni compilación, ni
dependencias que instalar. Se abre un `index.html` y funciona.

## Qué es y qué no es

Es una **demostración funcional de la interfaz**. Las pantallas, la navegación,
las validaciones y los flujos están completos y se pueden recorrer, pero:

- **No hay backend.** No se envía nada a ningún servicio y no se sincroniza con
  ningún servidor. Los datos viven en memoria, en la pestaña del navegador, y
  se pierden al recargar. Es deliberado: que una pantalla "funcione" no debe
  hacer creer que los datos están guardados en algún sitio.
- **El acceso es de demostración.** Acepta cualquier correo y contraseña
  porque no hay nada que verificar contra un servidor. La sesión tampoco se
  guarda: recargar vuelve a pedir el acceso.
- **El QR de emergencia no está implementado.** La acción "Ver QR" lo dice en
  pantalla. No se dibuja un patrón de ejemplo, porque en una emergencia un QR
  con aspecto escaneable haría perder tiempo a un sanitario.

Lo que falta para conectar un backend está detallado, archivo y archivo, en
[`INTEGRACION-BACKEND.md`](INTEGRACION-BACKEND.md).

## Requisitos

- **Node.js 18 o superior** — solo para las pruebas; la web no lo necesita.
- Un navegador: Microsoft Edge o Google Chrome.
- **Nada más.** No hay `package.json`, ni `node_modules`, ni `npm install`.

## Cómo abrirlo

El sitio es estático, así que basta con servir la carpeta por HTTP y abrir la
raíz. Con Node, que ya hace falta para las pruebas, sin instalar nada:

```
node -e "const h=require('http'),f=require('fs'),p=require('path');const M={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};h.createServer((q,r)=>{const u=q.url.split('?')[0]==='/'?'/index.html':q.url.split('?')[0];const d=p.join(process.cwd(),u);if(!f.existsSync(d)){r.writeHead(404);return r.end('')}r.writeHead(200,{'Content-Type':M[p.extname(d)]||'application/octet-stream'});r.end(f.readFileSync(d))}).listen(8000)"
```

Y luego <http://localhost:8000>. Al entrar sin sesión, el portal muestra la
pantalla de acceso; con cualquier correo y contraseña se entra.

> Abrir `index.html` con doble clic también funciona, pero algunos navegadores
> restringen ciertas cosas con el protocolo `file://`. Servirlo por HTTP es lo
> recomendado.

## Estructura

```
index.html            marcado base y orden de carga de los scripts
css/
  main.css            tokens de diseño y estilos base
  app-shell.css       barra superior, navegación lateral e inferior
  design-system.css   botones, formularios, tarjetas, utilidades
  citasDocumentos.css vistas de Citas y Documentos
  inicio.css  salud.css  historial.css  perfil.css  acceso.css
js/
  app.js              arranque y enlace del router con cada módulo
  router.js           navegación por hash: es el único punto que cambia de vista
  icons.js            iconos SVG locales (no hay CDN ni fuentes remotas)
  core/acciones.js    delegación de eventos por data-action
  components/         navbar, modal, tabla, expediente
  data/store.js       los datos de demostración y el estado en memoria
  lib/validaciones.js reglas de validación compartidas con la app móvil
  modules/            una vista por archivo: inicio, salud, historial,
                      citas, documentos, perfil, acceso, onboarding
tests/
  run.js              suite completa (la que se ejecuta)
  harness.js          las comprobaciones, dentro de la página
  capturar.js         capturas de cada vista en móvil, tableta y escritorio
```

Las responsabilidades van así: `store.js` guarda el estado y los datos de
ejemplo; cada módulo de `js/modules/` pinta su vista y su lógica; `router.js`
decide qué vista se ve; `acciones.js` reparte los clics y el envío de
formularios. Para añadir una vista hay que tocar esos cuatro sitios, no más.

## Rutas

| Ruta | Vista |
|---|---|
| `#/acceso` | Acceso (también `#/acceso/registro` y `#/acceso/recuperar`) |
| `#/onboarding` | Configuración inicial, tras entrar la primera vez |
| `#/inicio` | Inicio |
| `#/salud` | Expediente clínico |
| `#/historial` | Historial de consultas |
| `#/citas` | Citas (`#/citas/proximas`, `#/citas/historial`, `#/citas/agendar`) |
| `#/documentos` | Documentos (`#/documentos/recetas`, `#/documentos/examenes`) |
| `#/perfil` | Perfil del paciente |

## Pruebas

```
node tests/run.js
```

Ejecuta en un navegador real (Edge o Chrome, en modo headless) **378
comprobaciones** del recorrido principal, **8 por cada uno de los 10 enlaces
directos** (recarga con la URL ya escrita) y **56 mediciones responsive** (8
vistas × 7 anchos: 360, 390, 430, 540, 768, 1024 y 1440 px).

Sale con código `0` si todo pasa, `1` si falla alguna comprobación y `2` si
falta Node, el navegador o `index.html`. El detalle está en
[`tests/README.md`](tests/README.md).

Las capturas para revisión visual se generan aparte y **no** forman parte de
la suite:

```
node tests/capturar.js
```

Las deja en `.capturas/`, que está en `.gitignore`.

## Qué hay que mirar antes de dar algo por terminado

- El acceso es de demostración y la sesión no se guarda. Al recargar se vuelve
  a pedir el acceso. No es un fallo.
- Los datos de ejemplo son ficticios y hay que mantenerlos como tales: si
  aparece un nombre real, un DNI real o un historial clínico real, hay que
  quitarlo antes de compartir el repositorio.
- El QR no funciona. No hay que presentarlo como implementado.

## Documentación

- [`AUDITORIA_FRONTEND.md`](AUDITORIA_FRONTEND.md): qué hay en el proyecto,
  con qué está construido y qué se revisó.
- [`INTEGRACION-BACKEND.md`](INTEGRACION-BACKEND.md): qué falta para conectar
  un backend, dónde está el punto de corte en el código y qué se vería hoy.
- [`tests/README.md`](tests/README.md): qué comprueba cada bloque de pruebas.
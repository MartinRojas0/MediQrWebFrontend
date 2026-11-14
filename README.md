# MediQR — Portal del paciente (frontend)

Frontend web del portal de pacientes de MediQR. Es un sitio estático de
**HTML, CSS y JavaScript plano**, sin framework ni dependencias de ejecución.
El build prepara los archivos para Vercel y configura la URL de la API.

## Qué es y qué no es

Es el frontend del MVP con integración al backend para registro, inicio de
sesión y consulta/edición del perfil. La URL de la API se configura al compilar;
consulta [`DEPLOYMENT.md`](DEPLOYMENT.md) para producción.

- **Solo algunas áreas se sincronizan.** Citas, documentos, medicamentos,
  vacunas, contactos y alertas aún no son funciones persistentes.
- **Las confirmaciones de la campana son de esta sesión.** Se generan a partir
  de acciones reales de la interfaz, se mantienen solo en memoria y se borran
  al salir; no son notificaciones ni recordatorios del servidor.
- **El QR de emergencia no está implementado.** La acción "Ver QR" lo dice en
  pantalla. No se dibuja un patrón de ejemplo, porque en una emergencia un QR
  con aspecto escaneable haría perder tiempo a un sanitario.
- **No es un sistema clínico.** No uses información médica real ni la app para
  tomar decisiones médicas o atender emergencias.

El alcance inicial y sus pendientes están documentados en
[`INTEGRACION-BACKEND.md`](INTEGRACION-BACKEND.md), que es histórico. La
configuración actual está en [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Estado verificado

Verificación manual con datos sintéticos el 2026-11-14:

- La web pública de Vercel respondió HTTP 200 y carga la API HTTPS de Render.
- Registro e inicio de sesión completados; el token de sesión se restauró
  después de recargar la misma pestaña.
- El perfil personal se actualizó y volvió a leerse desde la API después de
  recargar. `/api/health` respondió HTTP 200 con CORS para el origen de Vercel.
- Neon no se modificó durante estas pruebas. La suite local no prueba Neon.

El aviso `404` de `/api/historial-clinico/me` para una cuenta nueva significa
que todavía no hay fila de historial; el frontend lo trata como historial vacío.
No se introdujo información médica real.

## Requisitos

- **Node.js 18 o superior** — para el build y las pruebas; no se requieren
  dependencias de ejecución.
- Un navegador: Microsoft Edge o Google Chrome.

## Ejecución local

El sitio es estático, así que basta con servir la carpeta por HTTP y abrir la
raíz. Con Node, que ya hace falta para las pruebas, sin instalar nada:

```
node -e "const h=require('http'),f=require('fs'),p=require('path');const M={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};h.createServer((q,r)=>{const u=q.url.split('?')[0]==='/'?'/index.html':q.url.split('?')[0];const d=p.join(process.cwd(),u);if(!f.existsSync(d)){r.writeHead(404);return r.end('')}r.writeHead(200,{'Content-Type':M[p.extname(d)]||'application/octet-stream'});r.end(f.readFileSync(d))}).listen(8000)"
```

Y luego <http://localhost:8000>. Para desarrollo local, `js/config.js` apunta
a `http://localhost:8080/api`; ejecuta el backend según su
[`README.md`](../MedyQR_BACKEND/README.md). Debe estar disponible para
registrarse, iniciar sesión y sincronizar el perfil. Si no está accesible, la
aplicación muestra el error en lugar de simular una sesión.

> Abrir `index.html` con doble clic también funciona, pero algunos navegadores
> restringen ciertas cosas con el protocolo `file://`. Servirlo por HTTP es lo
> recomendado.

## Estructura

```
index.html            marcado base y orden de carga de los scripts
css/
  main.css            patrones compartidos de las vistas
  app-shell.css       barra superior, navegación lateral e inferior
  design-system.css   botones, formularios, tarjetas, utilidades
  citasDocumentos.css vistas de Citas y Documentos
  inicio.css  salud.css  historial.css  perfil.css  acceso.css
js/
  app.js              arranque y enlace del router con cada módulo
  router.js           navegación por hash: es el único punto que cambia de vista
  icons.js            iconos SVG locales (no hay CDN ni fuentes remotas)
  core/acciones.js    delegación de eventos por data-action
  components/         navbar, modal y avisos de actividad de la sesión
  data/store.js       estado en memoria y datos de módulos aún no conectados
  lib/validaciones.js reglas de validación compartidas con la app móvil
  modules/            una vista por archivo: inicio, salud, historial,
                      citas, documentos, perfil, acceso, onboarding
tests/
  run.js              suite completa (la que se ejecuta)
  harness.js          las comprobaciones, dentro de la página
  capturar.js         capturas de cada vista en móvil, tableta y escritorio
```

`js/data/api.js` envía las llamadas autenticadas al backend. `js/modules/acceso.js`
registra e inicia sesión y valida la sesión restaurada; `js/data/store.js`
carga el perfil del paciente desde la API. `js/modules/perfil.js` envía y
presenta los cambios del perfil; en modo API, un error mantiene el borrador en
el formulario y no modifica el estado local como si se hubiera guardado.
Las vistas que aún no están conectadas usan datos de demostración en memoria.

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

Ejecuta en un navegador real (Edge o Chrome, en modo headless) **389
comprobaciones** del recorrido principal, **8 por cada uno de los 10 enlaces
directos** (recarga con la URL ya escrita) y **56 mediciones responsive** (8
vistas × 7 anchos: 360, 390, 430, 540, 768, 1024 y 1440 px).
La suite verifica la interfaz local; no llama a Render ni demuestra la
persistencia en Neon.

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

- La sesión se guarda en `sessionStorage` y se restaura al recargar la misma
  pestaña; no se conserva al cerrar la pestaña o el navegador.
- El correo de acceso no se modifica desde el formulario del perfil. El cambio
  de correo/contraseña y la recuperación de contraseña siguen pendientes.
- Los datos de ejemplo son ficticios y hay que mantenerlos como tales: si
  aparece un nombre real, un DNI real o un historial clínico real, hay que
  quitarlo antes de compartir el repositorio.
- El perfil médico no formó parte de la prueba de persistencia final.
- El QR no funciona. No hay que presentarlo como implementado.

## Documentación

- [`AUDITORIA_FRONTEND.md`](AUDITORIA_FRONTEND.md): qué hay en el proyecto,
  con qué está construido y qué se revisó.
- [`INTEGRACION-BACKEND.md`](INTEGRACION-BACKEND.md): qué falta para conectar
  un backend, dónde está el punto de corte en el código y qué se vería hoy.
- [`tests/README.md`](tests/README.md): qué comprueba cada bloque de pruebas.
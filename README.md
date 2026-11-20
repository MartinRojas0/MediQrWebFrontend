# MediQR — Portal del paciente (frontend)

Frontend web del portal de pacientes de MediQR. Es un sitio estático de
**HTML, CSS y JavaScript plano**, sin framework ni dependencias de ejecución.
El build real prepara los archivos para Vercel e inyecta la URL del backend.
Los Vercel Previews usan una variante DEMO independiente, sin backend.

## Qué es y qué no es

El frontend se conecta al backend para registro, inicio de sesión, perfil,
historial básico, contacto de emergencia, QR, documentos privados y citas.
Medicamentos y recordatorios mantienen las autorizaciones actuales y no son
editables por pacientes. La URL de API se configura al compilar; consulta
[`DEPLOYMENT.md`](DEPLOYMENT.md).

- **Preview DEMO aislado:** la variante de Vercel Preview solo permite elegir
  entre Pedro, Martin y Verónica. No contiene el formulario de contraseña, el
  cliente HTTP ni la URL del backend. Los perfiles y cambios son sintéticos y
  viven solo en memoria; la ficha QR es ilustrativa y no escaneable.
- **Demo local integrada:** la pantalla de acceso del portal real conserva
  botones de perfiles ficticios que no llaman al API.
- **Autenticación real:** iniciar sesión o registrarse con el formulario
  habitual sigue usando el backend configurado y sus controles de acceso.
- Ninguna demo equivale a autenticación ni autorización verificadas por el
  servidor. Sus datos y cambios desaparecen al recargar o cambiar de perfil.
- **Las confirmaciones de la campana son de esta sesión.** Se generan a partir
  de acciones reales de la interfaz, se mantienen solo en memoria y se borran
  al salir; no son notificaciones ni recordatorios del servidor.
- **No es un sistema clínico.** No uses información médica real ni la app para
  tomar decisiones médicas o atender emergencias.

[`INTEGRACION-BACKEND.md`](INTEGRACION-BACKEND.md) describe el estado anterior
a esta integración y se conserva solo como referencia histórica.

## Verificación local de esta integración

Con H2 local aislada y datos ficticios se verificó:

- `npm test`: 8/8 pruebas; el build real y el build DEMO aislado compilan.
- `node tests/run.js`: 402/402 comprobaciones de interfaz y responsive. Este
  harness bloquea la red y no sustituye pruebas de integración.
- En Edge contra el backend local: login, navegación por QR/documentos/citas,
  emisión y renderizado de PNG QR, estado vacío de documentos y llamadas API
  sin errores JavaScript. Se verificaron anchos de escritorio y móvil.
- La creación, reprogramación, cancelación, persistencia y aislamiento de citas
  se cubren en `MiCitaControllerIntegrationTest`; el navegador no pudo reservar
  una cita porque la H2 de demostración no contiene personal de salud activo.

La salida local del build DEMO se limita a su HTML, CSS y JavaScript aislados.
Las suites locales no verifican datos de producción, PostgreSQL, Render ni
Neon.

## Requisitos

- **Node.js 18 o superior** — para el build y las pruebas; no se requieren
  dependencias de ejecución.
- Un navegador: Microsoft Edge o Google Chrome.

## Ejecución local

```
$env:MEDIQR_API_URL = 'http://127.0.0.1:8081/api'
npm run build
npm run serve
```

El build escribe el sitio en `dist/`; `npm run serve` lo sirve en
`http://127.0.0.1:8810`. Inicia el backend en `127.0.0.1:8081` con el perfil
demo según el README del backend. El perfil usa H2 en archivo y un directorio
local para documentos; ninguno debe apuntar a producción. Ejecuta
`node tests/run.js` por separado para el harness de interfaz.

Para generar y servir la variante aislada sin backend:

```
npm run build:demo
npm run serve
```

## Estructura

```
index.html            marcado del portal real y orden de carga de scripts
index.demo.html       entrada separada para el build DEMO de Preview
css/
  main.css            patrones compartidos de las vistas
  app-shell.css       barra superior, navegación lateral e inferior
  design-system.css   botones, formularios, tarjetas, utilidades
  citasDocumentos.css vistas de Citas y Documentos
  inicio.css  salud.css  historial.css  perfil.css  acceso.css
js/
  app.js              arranque y enlace del router con cada módulo
  demo-app.js         app aislada del Preview con datos sintéticos en memoria
  router.js           navegación por hash: es el único punto que cambia de vista
  icons.js            iconos SVG locales (no hay CDN ni fuentes remotas)
  core/acciones.js    delegación de eventos por data-action
  components/         navbar, modal y avisos de actividad de la sesión
  data/store.js       estado de sesión y sincronización con la API
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
sincroniza el perfil, el historial y las citas. Los módulos de QR y documentos
usan rutas autenticadas y borran el estado al cambiar de sesión. Los fallos de
API se muestran sin presentar una operación no persistida como guardada.

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

## Límites conocidos

- Las sesiones reales se conservan en `sessionStorage` y se validan contra el
  backend al restaurarse; las demos no se guardan. Cerrar sesión borra el
  estado del paciente anterior.
- El cambio/recuperación de contraseña sigue pendiente.
- Reservar citas requiere que existan profesionales activos y horarios válidos.
- El almacenamiento local de documentos sirve para pruebas; producción requiere
  un volumen persistente o almacenamiento privado de objetos.
- Las cuentas locales y todos sus datos son ficticios. No cargues información
  médica real ni compartas el archivo H2 o los documentos locales.

## Documentación

- [`docs/GUIA_DEMO.md`](docs/GUIA_DEMO.md): arranque y recorrido local.
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md): componentes y comunicación.
- [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md): configuración y limitaciones.
- [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md): autenticación, permisos, QR y archivos.
- [`docs/MIGRACIONES.md`](docs/MIGRACIONES.md): orden y validaciones pendientes.
- [`AUDITORIA_FRONTEND.md`](AUDITORIA_FRONTEND.md): qué hay en el proyecto,
  con qué está construido y qué se revisó.
- [`INTEGRACION-BACKEND.md`](INTEGRACION-BACKEND.md): registro histórico del
  estado previo a la integración.
- [`tests/README.md`](tests/README.md): qué comprueba cada bloque de pruebas.
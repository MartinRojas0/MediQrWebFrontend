# ==========================================================
# MediQR - Pruebas funcionales
#
# Ejecuta 402 comprobaciones funcionales, 11 cargas por enlace directo y 56 mediciones responsive en un navegador real
# (Microsoft Edge o Google Chrome) en modo headless.
# La suite usa una configuración local sin API; no comprueba Render ni Neon.
#
# REQUISITOS
#   - Node.js 18 o superior  (node --version)
#   - Microsoft Edge o Google Chrome instalado
#   - No hace falta instalar nada mas: no hay dependencias.
#   - MEDIQR_TEST_FAST=1 ejecuta las 402 comprobaciones funcionales e
#     inmediatamente omite las recargas por enlace directo y las mediciones
#     responsive, que requieren muchos lanzamientos del navegador.
#
# USO
#   node tests/run.js
#   node tests/run.js /ruta/otra/copia/del/proyecto
#   $env:MEDIQR_TEST_FAST = "1"; node tests/run.js
#   set BROWSER="C:\Program Files\Google\Chrome\Application\chrome.exe"
#   node tests/run.js
#   set PORT=8800 && node tests/run.js
#
# CODIGO DE SALIDA
#   0  todas las comprobaciones pasan
#   1  alguna comprobacion falla, o el navegador no arranco
#   2  falta Node, el navegador o index.html
#
# QUE SE COMPRUEBA
#   R.*  recursos: rutas desde la raiz, CSS aplicado, sin peticiones a terceros
#   N.*  navegacion: menu, iconos SVG, ausencia del enlace muerto
#   AV.* centro de avisos de actividad de la sesión, sin persistencia
#   P.*  privacidad: ausencia de datos personales en el DOM
#   V1.* vista Inicio
#   V2.* vista Citas (calendario, proximas, historial, agendar)
#   V3.* vista Documentos (listado, filtros, sub-vistas)
#   V4.* vista Perfil (pestanas, edicion)
#   M.*  modales unificados: apertura, titulo, foco, cierre con Escape
#   G.*  estado global y errores de JavaScript
#   RT.* router: hash, sub-vistas, aria-current, foco, atras/adelante
#   N.1*  vista Salud (expediente clinico) y su alerta critica
#   V.*   validaciones de datos (nombre, DNI, telefono, email, contrasena, edad)
#   H.*   historial de consultas: orden, buscador, vacio y adjuntos
#   S.*   flujo SOS: cuenta atras, cancelar, Escape y veracidad del aviso
#   F.*   flujos completos: reprogramar, finalizar, cancelar, agendar,
#          editar Salud, grupo sanguineo y panel SOS con su confirmacion
#   X.*   editar el perfil como una persona: abrir, pinchar en cada campo,
#          escribir, guardar, cancelar, reabrir y descartar sin guardar
#   K.*   controles que antes solo estaban registrados y se pulsan de verdad
#   A.*   acceso: pending de backend, sin contrasena guardada ni red
  #   L.*   acceso en modo demostracion y configuracion inicial (onboarding)
  #   PAC.* nombre del paciente: fuente unica, guardado y propagacion a Inicio
  #         y Perfil
  #   D.*   carga por enlace directo: sin sesion, un enlace al portal devuelve
  #         al acceso; tras entrar, la ruta pedida se abre con normalidad
#   E.*   edicion: guardados locales y aviso antes de descartar cambios
#   D.*   funciones pendientes: QR sin patron, alta local de documentos
#   P.*   accesibilidad: h1 unico, alt, nombres, foco, enlace de salto
#   G.*   estado global: iconos dibujados, formatos de fecha y hora unicos,
#          ausencia de peticiones a la red y de promesas de guardado
#   N.*   paridad con el movil (Salud, Perfil, alertas, validaciones)
#
# Y una tercera pasada mide cada vista dentro de un iframe de ancho fijo
# (360, 390, 430, 540, 768, 1024 y 1440 px) para detectar desbordamiento
# horizontal. --window-size no baja de 492 px en headless, por eso la
# medicion se hace con iframes de ancho exacto y no con la ventana.
#
# Ademas abre el portal en 11 rutas distintas (inicio, perfil, salud,
# historial, QR, citas/agendar,
# citas/historial, documentos/todos, recetas, examenes y una ruta
# inexistente) para comprobar que restaura la vista correcta al cargar, que
# es lo que ocurre al recargar con la URL ya escrita.
#
# NOTAS
#   - El harness se sirve como archivo aparte (/__test__/harness.js) y no
#     incrustado, para que sus propias cadenas de busqueda no formen parte
#     del DOM que inspeccionan las comprobaciones de privacidad.
#   - El codigo del sitio usa alert(); en el harness se sustituye por un
#     registro porque un dialogo nativo bloquearia la pagina en headless.
# ==========================================================

## Capturas para revision visual

    node tests/capturar.js

Genera las seis vistas en movil (390), tablet (768) y escritorio (1400) en
`.capturas/`. La app se renderiza dentro de un iframe del ancho exacto
porque `--window-size` no baja de ~492 px en Windows y una captura
directa sale recortada, haciendo creer que la pagina se desborda.
Cada captura usa su propio perfil de navegador para evitar que el
siguiente proceso compita por el bloqueo del anterior.

## Variante DEMO aislada

`npm test` ejecuta las pruebas Node de autenticación y del build aislado. La
prueba DEMO construye sin `MEDIQR_API_URL`, comprueba que `dist/` solo contiene
su HTML, CSS y JavaScript, y verifica que no incluye el cliente HTTP ni el
formulario de acceso real. También recorre los seis módulos con perfiles
ficticios y comprueba que los cambios en memoria no sobreviven al cambiar de
perfil.

Vercel selecciona esta variante con `VERCEL_ENV=preview`; los builds de
producción y locales siguen usando el portal real.

# ==========================================================
# MediQR - Pruebas funcionales
#
# Ejecuta 289 comprobaciones funcionales, 10 cargas por enlace directo y 35 mediciones responsive en un navegador real
# (Microsoft Edge o Google Chrome) en modo headless.
#
# REQUISITOS
#   - Node.js 18 o superior  (node --version)
#   - Microsoft Edge o Google Chrome instalado
#   - No hace falta instalar nada mas: no hay dependencias.
#
# USO
#   node tests/run.js
#   node tests/run.js /ruta/otra/copia/del/proyecto
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
#   A.*   acceso: pending de backend, sin contrasena guardada ni red
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
# Ademas abre el portal en 9 rutas distintas (inicio, perfil, citas/agendar,
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

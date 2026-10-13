# ==========================================================
# MediQR - Pruebas funcionales
#
# Ejecuta 112 comprobaciones funcionales y 8 cargas por enlace directo en un navegador real
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
#
# Ademas abre el portal en 8 rutas distintas (inicio, perfil, citas/agendar,
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
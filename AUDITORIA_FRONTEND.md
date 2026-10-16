# MediQR — Auditoría técnica del frontend web

**Fecha:** 2026-10-13
**Alcance:** inspección estática del repositorio `mediqr-front`. No se modificó ningún archivo del proyecto.
**Método:** lectura completa de los 9 archivos, búsquedas dirigidas y una verificación de ejecución con Node (solo módulos built-in, en carpeta temporal, sin instalar dependencias).

---

## 0. Estado actual (actualización posterior a la auditoría)

Este documento es la foto de un momento concreto: lo que había antes de que se añadiera
la pantalla de acceso. Lo que vino después no está descrito en el resto del informe, así
que conviene tener presente esta diferencia antes de leerlo.

Cinco archivos que aparecen en el inventario de la sección 1 ya no están en el
repositorio: eran código sin usar o sin cargar y se eliminaron al limpiar el
proyecto. Si se buscan aquí, no van a aparecer:

- `js/navigation.js`, `js/modalControl.js`, `js/profileEdit.js`,
  `js/citasDocumentos.js`: código muerto, sin cargar por `index.html`.
- `img/qr-sample.png`: imagen de ejemplo sin referenciar. El QR real sigue sin
  estar implementado.

Los nombres que aparecen en las secciones de propuestas (por ejemplo
`tokens.css` o `api.js`) son recomendaciones de la auditoría, no archivos
existentes: describen a dónde debería ir cada cosa si se hiciera esa mejora.

### Implementado y verificado

- **Portal de seis vistas** (Inicio, Salud, Historial, Citas, Documentos, Perfil) con
  navegación por hash y adaptación a móvil, tableta y escritorio.
- **Acceso de demostración.** Es una pantalla de entrada propia, no autenticación: acepta
  cualquier correo y contraseña porque no hay servidor contra el que comprobarlos, y así
  lo dice en pantalla. La sesión vive **solo en memoria**, en `AccesoModulo.sesion`.
- **Configuración inicial (onboarding) de tres pasos** tras entrar la primera vez, con
  progreso, retroceso que conserva lo escrito, resumen y opción de omitir.
- **Nombre del paciente con una sola fuente de verdad.** `MediModules.paciente` es el
  único sitio del que leen Inicio y Perfil. Se corrigió una causa raíz: el guardado del
  onboarding sustituía el objeto entero y borraba DNI, correo, teléfono y dirección.
  Ahora escribe campo a campo sobre el modelo.
- **Verificación automática:** 378 comprobaciones en el recorrido principal y 8 en cada
  uno de los 10 enlaces directos (recarga con la URL ya escrita). Todas en verde.

### Demostrativo, no real

- El **acceso no autentica a nadie** y la sesión se pierde al recargar, a propósito: no
  se guarda nada en `localStorage`, `sessionStorage` ni cookies.
- El **QR no está implementado**. La acción "Ver QR" muestra un aviso de que queda
  pendiente. Sigue sin haber un patrón que se pueda escanear; dibujarlo a mano daría una
  falsa impresión de que funciona, así que no se ha puesto.
- No hay envío de datos a ningún servicio: `tests/harness.js` comprueba que no sale
  ninguna petición a la red.

### Pendiente

- QR real, autenticación real y conexión con el backend. Ver `INTEGRACION-BACKEND.md`
  para lo que haría falta en cada caso.

---

## 1. Tecnología y estructura comprobadas

### 1.1 Lo que realmente hay

**No es Next.js, ni React, ni TypeScript, ni Tailwind.** Es un sitio estático de HTML + CSS + JavaScript plano, servido sin proceso de compilación.

| Elemento | Valor comprobado | Evidencia |
|---|---|---|
| Framework | Ninguno | No existe `package.json`, `node_modules`, ni archivos `.jsx/.tsx/.ts` |
| Lenguaje | JavaScript (ES2015+) | `js/*.js`, sintaxis `const`, arrow functions, `?.`, template literals |
| Tipado | Ninguno | Sin TypeScript, sin JSDoc |
| Estilos | CSS plano, 2 archivos, sin preprocesador | `css/main.css` (103 líneas), `css/citasDocumentos.css` (747 líneas) |
| Build | Ninguno | No hay `package.json`, `Makefile`, ni script de compilación |
| Dependencias runtime | 2 externas por CDN | Font Awesome 6.5.1 (`index.html:8`), `ui-avatars.com` (`index.html:259`) |
| Tests | Ninguno | Sin framework ni archivos de prueba |
| Lint / format | Ninguno | Sin `.eslintrc`, `.prettierrc`, `biome.json` |
| Control de versiones | **Ninguno** | `git status` → `fatal: not a git repository` |
| CI/CD | Ninguno | Sin `.github/`, `.gitlab-ci.yml`, etc. |

### 1.2 Inventario de archivos (9 archivos, 139.3 KB)

```
css/citasDocumentos.css     12.1 KB   Estilos de calendario, documentos, modales
css/main.css                 6.4 KB   Tokens de diseño, layout base, formularios
index.html             28.4 KB   Única página; 610 líneas; incluye un <script> inline de 110 líneas
img/avatar.png              23.0 KB   NO REFERENCIADO
img/qr-sample.png           12.3 KB   NO REFERENCIADO
js/citasDocumentos.js       52.6 KB   1601 líneas; módulo Citas + Documentos
js/modalControl.js           1.1 KB   NO CARGADO (código muerto)
js/navigation.js             1.1 KB   NO CARGADO (código muerto)
js/profileEdit.js            2.4 KB   NO CARGADO (código muerto)
```

### 1.3 Arquitectura actual (real)

- **Una sola página HTML.** No hay enrutado por URL: la "navegación" es ocultar/mostrar secciones con la clase `.hidden`.
- **4 vistas** declaradas como `<section>`: `#view-inicio`, `#view-citas`, `#view-documentos`, `#view-perfil`.
- **Renderizado por `innerHTML`.** No hay framework de componentes niDOM virtual.
- **Datos ficticios en memoria**, defined dentro del propio módulo JS (`citasDocumentos.js:44-91`).
- **Sin capa de datos.** No hay `fetch`, ni `localStorage`, ni capa de servicios. La integración futura con el backend Spring Boot requerirá crearla desde cero.

### 1.4 Arquitectura pretendida (y por qué está rota)

El código sugiere una organización modular que **nunca llegó a aplicarse**. `index.html` carga un solo archivo externo (`citasDocumentos.js`, línea 608), pero existen 3 archivos más con el mismo propósito. El resultado es que la lógica está partida entre un bloque inline dentro del HTML y un módulo externo.

---

## 2. Inventario de pantallas y funcionalidades

### 2.1 Lo que EXISTE y funciona

**Vista Inicio (dashboard)** — `index.html:56-160`
- Saludo + 5 tarjetas: QR de emergencia, próxima cita, última consulta, medicamentos, accesos rápidos.

**Vista Citas** — `index.html:163-170`, implementado en `citasDocumentos.js`

| Sub-vista | Método | Estado |
|---|---|---|
| Calendario mensual | `calendario()` | Funcional. Navegación de mes, selección de día, eventos por día, leyenda de estados |
| Próximas citas | `listaCitas()` | Funcional. Filtra `estado === "Próxima"` |
| Historial de citas | `listaCitas()` | Funcional. Filtra `estado !== "Próxima"` |
| Agendar cita | `agendar()` | Funcional. Especialidad → médico → fecha → hora → lugar, con resumen previo a confirmar |

**Vista Documentos** — `index.html:173-245`, implementado en `citasDocumentos.js`

| Sub-vista | Método | Estado |
|---|---|---|
| Listado con filtros | `documents()` | Funcional. Búsqueda por texto, tipo, rango de fechas |
| Sub-vistas por tipo | `filasDocumento()` | Funcional. Recetas / Exámenes / Informes / Otros |
| Subir documento | `documentForm()` | Funcional. Validación de tipo MIME y tamaño, vista previa |
| Ver / Descargar / Eliminar | `verDocumento()` / `descargarDocumento()` / `eliminarDocumento()` | Funcional |

**Vista Perfil** — `index.html:250-382`, con lógica inline

| Sub-pestaña | Estado |
|---|---|
| Información Personal | Lectura + edición visual (6 campos) |
| Información Médica | Lectura + edición visual (4 campos) |
| Contactos de Emergencia | 1 contacto hardcodeado, agregar/eliminar solo con `alert()` |
| Configuración | 3 toggles sin persistencia; cambiar contraseña (validación visual) y cerrar sesión (`alert()`) |

**Módulo de citas — calidad notable.** Ver §4.1.

### 2.2 Lo que NO existe (pendiente)

Estos ítems del alcance funcional que mencionaste **no tienen ninguna implementación**, ni siquiera un stub:

- ❌ **Medicamentos como módulo.** Solo hay una tarjeta estática en el dashboard (`index.html:121-132`) con un solo medicamento hardcodeado. No hay lista, ni dosages, ni registro de tomas.
- ❌ **Recordatorios.** El toggle "Recordatorios de medicamentos" existe (`index.html:358`) pero no está conectado a nada.
- ❌ **Historial clínico / consultas médicas.** El botón "Historial clínico" (`index.html:138`) ejecuta `alert('Dirigiendo a Historial clínico')`. No hay pantalla.
- ❌ **Detalle de consulta.** El botón "Ver consulta" (`index.html:117`) ejecuta `alert(...)`. No hay pantalla.
- ❌ **Autorizaciones, juntas médicas.** Sin rastro.
- ❌ **Códigos QR funcionales.** El QR es un SVG decorativo dibujado a mano (`index.html:79-86` y `395-402`) que **no es escaneable**. El botón "Descargar QR" ejecuta `alert()`.
- ❌ **Chatbot.** Sin rastro. El espacio reservado puede ser un botón futuro, pero hoy no existe nada.
- ❌ **Login / autenticación.** No hay pantalla de acceso; el portal arranca ya "dentro".

---

## 3. Problemas encontrados (con evidencia y prioridad)

### 3.1 Defectos comprobados

#### B — BLOQUEANTE

**B1. El proyecto no tiene control de versiones.**
`git status` → `fatal: not a git repository`. Sin historial no hay forma de revertir una regresión ni revisar cambios. **Es el riesgo más grave del repositorio** y el primero que debe resolverse.
*Mitigación:* `git init` + commit inicial antes de tocar nada.

**B2. Duplicación de `switchSection` — comportamiento frágil por orden de carga.**
`switchSection` se declara dos veces en el camino de ejecución real:

| Ubicación | Línea | Implementación |
|---|---|---|
| `index.html` (inline) | 470 | Solo maneja `inicio` y `perfil` |
| `js/citasDocumentos.js` | 6 | Conmutador genérico de `view-*` |

Verificado empíricamente replicando el orden de carga real:

```
--- observed binding after load ---
index.html inline script
    -> effective switchSection = function switchSection(section) { document.getElement
js/citasDocumentos.js
    -> effective switchSection = function switchSection(section) { const vista = document.
Final effective switchSection uses the generic view-* switcher: true
```

Ambas son declaraciones de función en ámbito global. **Gana la última que se ejecuta**, y `citasDocumentos.js` (línea 608) se carga después del inline (línea 468). Por eso el sitio funciona hoy: la versión inline está **completamente muerta**, pero sigue contendo código que parece funcional. Si alguien añade `defer` o reordena los `<script>`, la navegación a Citas y Documentos se rompe silenciosamente.

#### A — ALTA

**A1. Tres archivos JavaScript nunca se cargan.**
Búsqueda de referencias a `navigation.js`, `modalControl.js` y `profileEdit.js` → **cero coincidencias**. Ningún `<script src>` los carga. Contienen `switchSection`, `switchProfileTab`, `openModal`, `closeModal`, `handlePasswordChange`, `enablePersonalEdit`, `savePersonalEdit` — es decir, código que **ya está duplicado** dentro del `<script>` inline de `index.html:468-578`.

Consecuencia práctica: si un desarrollador edita `profileEdit.js` ("el archivo del perfil"), **no ocurre nada**. Es una trampa de mantenimiento.

**A2. Dos sistemas de modal inconsistentes y solo uno es accesible.**

| Sistema | Ubicación | Implementación | Accesibilidad |
|---|---|---|---|
| A | `index.html:391-465` (5 modales) | `<div class="modal-backdrop">` + `classList` | ❌ Sin `role="dialog"`, sin `aria-modal`, sin `aria-labelledby`, sin trampa de foco, sin cerrar con `Escape`, sin `inert` en el fondo |
| B | `index.html:581-599` | `<dialog>` nativo con `showModal()` | ✅ Correcto: foco atrapado, `Escape` nativo, `::backdrop`, `aria-labelledby` |

El sistema B (usado por Citas/Documentos) es el correcto. El sistema A (usado por Perfil y QR) es un `div` que se muestra y se esconde.

**A3. Fuga de datos personales a un tercero.**
`index.html:259`:
```html
<img src="https://ui-avatars.com/api/?name=Paciente+Demo&background=0284c7&color=fff" ...>
```
Cada carga de la página **envía el nombre completo del paciente a un servidor externo en una query string**. Para un portal de datos médicos esto es un problema de privacidad, no un detalle cosmético. Peor: el repositorio ya contiene `img/avatar.png`, que además está sin usar.

**A4. `lang="en"` con contenido íntegramente en español.**
`index.html:2`. Afecta lectores de pantalla, pronunciación de synthesized speech y SEO. Debería ser `lang="es-PE"` o `lang="es"`.

**A5. Despliegue bloqueado por la estructura de carpetas.**
Las rutas son `../css/main.css` desde `index.html`. Esto obliga a que **la raíz del sitio web sea la raíz del repositorio**, con el entry point en `/html/`.

Consecuencia: si configuras el directorio de publicación como `html/` (lo natural en Netlify/Vercel/GitHub Pages), `../css/main.css` resuelve fuera de la raíz publicada → **404 en todos los estilos**. El sitio se ve sin estilos.

#### C — MEDIA

**C1. `.btn-primary-sm` se usa pero no existe.**
`index.html:336`: `<button class="btn btn-primary-sm">`. Buscada en ambos CSS: `.btn-outline-sm` (main.css:57) y `.btn-danger-sm` (main.css:58) existen; **`.btn-primary-sm` no está definida**. El botón "+ Agregar contacto" se renderiza sin estilo — texto plano sobre fondo blanco, sin affordance de botón.

**C2. Elemento de navegación muerto: `<a>Salud ▾</a>`.**
`index.html:20`. No tiene `href`, no tiene `onclick`, no tiene `id`. No hace absolutamente nada, pero aparenta ser un menú desplegable por el caret `▾`. El usuario lo pincha y no ocurre nada.

**C3. Caret engañoso en Perfil.**
`index.html:46`: `<a id="nav-perfil" onclick="switchSection('perfil')">Perfil ▾</a>`. Muestra `▾` pero no abre ningún submenú — la acción es un simple cambio de vista.

**C4. Assets muertos: `img/avatar.png` y `img/qr-sample.png`.**
23 KB + 12.3 KB que nunca se referencian (verificado).

**C5. CSS muerto: `.module-tabs`.**
`citasDocumentos.css:27-33`. Definido, nunca usado.

**C6. `alert()` como mecanismo de feedback.**
11 llamadas a `alert()` en el código (búsqueda en `index.html` y `citasDocumentos.js`). Bloquea la interfaz, es inaccesible y no es usable en móvil. El módulo de Citas/Documentos ya tiene una solución correcta (`MediModules.aviso()`, un toast con `role="status"`, `citasDocumentos.js:316-327`) que el resto de la app no utiliza.

**C7. Enlaces `<a>` usados como botones, sin accesibilidad de teclado.**
`index.html:19` (`nav-inicio`) y `46` (`nav-perfil`) son `<a>` sin `href` y **sin `tabindex`**, por lo que **no son focusables por teclado** — un usuario de teclado no puede activarlos. Solo los dos `.nav-trigger` tienen `tabindex="0" role="button"`. Trato inconsistente dentro del mismo navbar.

#### D — BAJA / Riesgo latente

**D1. Dependencias externas sin SRI ni fallback.** Font Awesome desde cdnjs (`index.html:8`) sin `integrity`. Si el CDN falla o está bloqueado en la red del hospital, **todos los iconos desaparecen**. No hay copia local.

**D2. `escapar()` no escapa comillas simples.** `citasDocumentos.js:172-180`. Usa `textContent` → `innerHTML`, que escapa `<`, `>`, `&` pero **no `'` ni `"`.** Existe un helper `atributo()` que sí escapa `"` y se usa en los atributos. Hoy no es explotable porque ningún dato del usuario se inyecta dentro de un atributo delimitado por comillas simples, pero es una trampa para quien escriba código nuevo.

**D3. Fuga de memoria con `URL.createObjectURL`.** `citasDocumentos.js:1543`. Los object URLs solo se revocan al eliminar el documento (`eliminarDocumento`, línea 1431). Recargar la página pierde los archivos (correcto, es demo) pero los blobs quedan vivos durante la sesión.

**D4. `iniciar()` no es idempotente.** `citasDocumentos.js:104-131` hace `delete cita.desp` sobre los datos. Si se llamara dos veces, `hoy + undefined` → `NaN` → fechas inválidas. Hoy se llama una vez (`línea 1577`), pero es una fragilidad latente.

**D5. Sin metadatos del documento.** No hay `description`, `og:`, favicon, ni manifest.

**D6. Sin manejo de errores ni estado de carga.** No hay `fetch` todavía, pero tampoco hay estructura alguna que lo soporte (ni capa de servicios, ni estado global, ni interceptores). Cuando se conecte el backend habrá que construirlo todo.

### 3.2 Distinción comprobado vs. potencial

| | Hallazgos |
|---|---|
| **Comprobados** (verificados leyendo o ejecutando) | B1, B2, A1, A2, A3, A4, A5, C1, C2, C3, C4, C5, C6, C7 |
| **Riesgos potenciales** (dependen del uso futuro) | D1, D2, D3, D4, D5, D6 |

---

## 4. Qué conviene conservar

### 4.1 El módulo de Citas + Documentos es sólido — es la mejor pieza del proyecto

`js/citasDocumentos.js` (1601 líneas) demuestra capacidad real de resolver problemas difíciles. **No debe reescribirse desde cero; debe extraerse y conservarse.**

Calidades específicas a preservar:

| Práctica | Ubicación | Por qué importa |
|---|---|---|
| Fechas ISO sin desfase de zona horaria | `fechaISO()` (136) y siempre `new Date(fecha + "T12:00:00")` | Evita el bug clásico de fechas que se corren un día según el huso. Es una decisión deliberada y correcta. |
| Escapado de HTML en dos niveles | `escapar()` (172) / `atributo()` (178) | Señal de que el autor pensó en XSS. Hay que corregirlo, no eliminarlo. |
| Validación de archivos por **MIME + tamaño** | `documentForm()` (1507-1527) | Correcto: valida `archivo.type` contra una lista blanca y limita a 10 MB. |
| `<dialog>` nativo con `showModal()` | `modal()` (296) | Foco atrapado, `Escape`, `::backdrop` gratis. Es la base del sistema de modales a adoptar. |
| Toast accesible | `aviso()` (316-327) con `role="status"` y auto-cierre | Patrón correcto, ya resuelto. Solo falta extender su uso. |
| Lógica de disponibilidad de horarios | `horariosDisponibles()` (817-850) | Descarta domingos, hora de refrigerio (13:00), horas pasadas, colisiones con otras citas del paciente y "ocupación" de otros pacientes. Es lógica de negocio de verdad. |
| Resumen antes de confirmar | `resumenCita()` (1079) | Patrón de buena UX para acciones irreversibles. |
| Confirmación antes de destructive | `pedirCancelar()` (649) / `pedirEliminar()` (1407) | Correcto: pide confirmación en cancelar cita y eliminar documento. |
| Recorrido del DOM como array | `.forEach` sobre `NodeList` (1580, 1593) | Estilo moderno y correcto; no usa `NodeList` crudo. |

### 4.2 Base visual reutilizable

`css/main.css` ya tiene un **sistema de tokens en `:root`** (líneas 1-13): `--primary`, `--danger`, `--info`, `--warning`, `--bg-main`, `--bg-card`, `--text-main`, `--text-muted`, `--border`, `--radius`. Es la base correcta sobre la que construir.

Además existen piezas reutilizables ya resueltas: `.card`, `.btn` + variantes, `.badge`, `.info-list` / `.info-row` (el layout etiqueta/valor), `.choice-grid` (chips seleccionables con soporte de teclado real), `.empty-state`, `.switch` (toggle accesible).

**Y hay un bug de css que vale la pena arreglar primero:** `.card` (main.css:34) define `grid-column: span 6` para el dashboard de 12 columnas, pero las tarjetas dentro de `.module-cards` y `.calendar-layout` la sobrescriben con `grid-column: auto`. Funciona, pero es frágil: cada nueva rejilla necesita recordar el override.

---

## 5. Evaluación de alternativas arquitectónicas

### 5.1 Las cuatro opciones

#### Opción A — Conservar tal cual

**Rechazada.** El sitio tiene ~250 KB sin comprimir, así que el problema no es rendimiento. Los problemas son de **integridad**: no hay Git, hay código muerto que aparenta estar vivo, hay un elemento de navegación que no hace nada, y hay una fuga de PII a un tercero. "Conservar tal cual" significaría arrastrar todo eso.

#### Opción B — Refactorizar sobre HTML/CSS/JS plano (reorganizar, no reescribir)

**Correcta para este momento, con un matiz importante:** no es solo "ordenar archivos", sino **establecer convenciones y una separación real** entre datos, lógica y presentación, más la infraestructura que falta (Git, tokens, ruta raíz).

- **A favor:** coste de migración casi nulo. Se conserva el 100% del módulo de Citas/Documentos, que es la parte difícil. Cero build, cero dependencias, carga instantánea. Despliegue trivial en cualquier hosting estático. El equipo mantiene un solo lenguaje.
- **En contra:** sin tipos, los errores aparecen en runtime. Sin framework, cada vista es `innerHTML` a mano. El riesgo de XSS se gestiona con disciplina propia (`escapar`), no por el compilador.

#### Opción C — Migrar a React + TypeScript + Tailwind

**Rechazada para ahora. Razones concretas:**

1. **No hay escala que lo justifique.** Son 9 archivos y ~1.300 líneas de JS. React aporta el mayor beneficio cuando hay estado complejo compartido, muchas vistas y un equipo grande. Aquí hay 4 vistas y un estado trivial.
2. **El estado real no justifica React.** Los datos son un array de 9 citas y uno de 9 documentos, en memoria. No hay necesidad de un modelo de estado global.
3. **El coste no es solo técnico: es de equipo.** Introduciría build, `node_modules`, TypeScript, Tailwind y un modelo mental de componentes, todo a la vez, mientras el equipo todavía está construyendo el portal. Eso divide el esfuerzo.
4. **Tailwind obligaría a reescribir los 850 líneas de CSS.** Los tokens de `:root` de `main.css` y las 50+ clases existentes habría que reconstruir una por una. Trabajo desechable.
5. **El sitio no tiene problemas de rendimiento.** HTML estático carga más rápido que una SPA con React. Migrar empeoraría la métrica que ningún usuario percibe.

**Cuándo reconsiderarlo:** si el portal llega a 10+ vistas, si aparece estado compartido entre vistas, si se incorporan dos o más personas al frontend, o si la lógica de datos crece hasta exigir tipado.

#### Opción D — Reconstrucción total desde cero

**Rechazada.** Contradice la restricción explícita de no reconstruir sin evidencia. Y sería un desperdicio: la lógica de disponibilidad de horarios, el manejo de fechas y la validación de archivos de `citasDocumentos.js` son trabajo real que ya está hecho y probado. Tirarlo sería tirar ventaja competitiva.

### 5.2 Comparación

| Criterio | B · Refactorizar | C · React+TS+Tailwind | D · Reconstruir |
|---|---|---|---|
| Coste de migración | **Muy bajo** (días) | Alto (semanas) | Muy alto (meses) |
| Aprovecha el código actual | **~90%** | Requiere reescritura de vistas | Se tira a la basura |
| Riesgo de regresión | **Bajo y controlable** | Alto (cambia todo a la vez) | Alto |
| Curva de aprendizaje | **Ninguna** | Alta (build + TS + Tailwind + React) | Ninguna, pero se pierde el conocimiento |
| Rendimiento | **Excelente** (HTML plano) | Bueno | Bueno |
| Accesibilidad | Manual, suficiente | **Mejor** (a11y en el ecosistema) | Manual |
| Despliegue | **Trivial** (cualquier host estático) | Necesita build + hosting con Node | Necesita build + hosting |
| Riesgo de sobre-ingeniería | Bajo | **Alto** para el estado actual | — |
| Offline / red restringida | **Total** (salvo iconos) | Depende del build | Depende del build |

### 5.3 Matiz importante sobre la recomendación

Refactorizar **no** significa seguir añadiendo `onclick` en el HTML. Significa:

1. **Un único sistema de modales** (el `<dialog>` nativo que ya existe).
2. **Un patrón de delegated events** en lugar de `onclick` inline: un solo listener en un contenedor raíz que despacha por `data-action`. Esto elimina la necesidad de funciones globales y resuelve de raíz los problemas A1/C7.
3. **Separación real de datos, lógica y vista**, aunque siga siendo JS plano:
   - `data/` → solo los datos ficticios, como módulo con funciones puras de lectura.
   - `lib/` → utilidades puras (fechas, escapado, formateo). Sin `document`.
   - `modules/` → un archivo por módulo (citas, documentos, perfil). Cada uno expone `render()`.
   - `app.js` → router y arranque.
4. **Delegación de eventos** en lugar de `onclick` inline: un solo listener en un contenedor raíz que despacha por `data-action`.

---

## 6. Recomendación final

### ✅ Refactorizar sobre HTML + CSS + JS plano. NO migrar a React/TypeScript. NO reconstruir.

**Mantener la tecnología actual**, reorganizar el código con convenciones claras y eliminar el código muerto. Migrar a React+TypeScript+Tailwind hoy sería sobre-ingeniería: no hay escala, estado ni problema de rendimiento que lo justifique, y el coste de equipo no se compensaría.

### Orden de decisión

1. **Primero Git.** Sin control de versiones no se puede hacer nada con seguridad.
2. **Corregir los bugs confirmados** (A1–A5, C1–C3) — son de horas, no de semanas.
3. **Desacoplar presentación, lógica y datos** en la estructura propuesta en §8.
4. **Migrar los modales al `<dialog>` nativo** y unificar en un solo sistema.
5. **Recién entonces** construir las pantallas que faltan.

---

## 7. Riesgos, costes y beneficios

### 7.1 Beneficios

| Beneficio | Impacto |
|---|---|
| **Elimina la trampa de mantenimiento A1** | Un desarrollador ya no puede editar un archivo que "no hace nada" |
| **Elimina la fuga de PII (A3)** | El nombre del paciente deja de enviarse a `ui-avatars.com` |
| **Navegación honesta** | Se eliminan el elemento muerto (C2) y el caret engañoso (C3) |
| **Despliegue resuelto** | Corregir A5 habilita publicar con `html/` como raíz y entry point en `/` |
| **Base para el backend** | La separación datos/lógica/vista es el prerrequisito para conectar Spring Boot sin reescribir |
| **Accesibilidad real** | Un solo sistema de modales con foco y `Escape` nativos |
| **Despliegue sin Internet en build** | Sin `node_modules`: el portal se puede servir desde cualquier servidor interno |
| **Cero dependencias de terceros** | Se puede autoalojar Font Awesome y eliminar el riesgo A3/D1 |

### 7.2 Costes

| Coste | Estimación |
|---|---|
| Inicializar Git y primer commit | ~15 minutos |
| Eliminar 3 archivos JS muertos y 2 imágenes muertas | ~10 minutos |
| Resolver A1–A5, C1–C3 | ~4–6 horas |
| Mover `index.html` a la raíz y ajustar rutas | ~30 minutos |
| Reorganizar en `data/lib/modules` | ~medio día |
| Unificar modales sobre `<dialog>` | ~medio día |
| Sistema de diseño (tokens + botones + formularios) | ~1 día |
| **Total hasta base sólida** | **~4–5 días de trabajo** |

**Coste cero:** migración de framework, nuevas dependencias, curva de aprendizaje, cambios en el backend, cambios en la app Android.

### 7.3 Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Romper la funcionalidad existente al reorganizar | **Media** — es el riesgo principal | Git con commits por etapa; una etapa = un commit revisable; validar manualmente cada vista antes de avanzar |
| Perder funcionalidad que no estaba documentada | Baja | Los 3 archivos JS muertos ya están duplicados inline, así que su contenido está preservado; verificar con búsqueda de referencias antes de borrar |
| Los datos ficticios de `citasDocumentos.js` se rompen al moverlos | Media | Moverlos literalmente primero, sin cambiar una línea; extraer la lógica después |
| El avatar local `img/avatar.png` no sea adecuado | Baja | Ya existe; si no sirve, generar iniciales en SVG local (sin red) |
| Que la reorganización se interprete como "reescritura" | Media | Mantener cada commit pequeño y explicitar en el mensaje qué se movió y por qué |
| Que el equipo pida React más adelante | — | Reevaluar con los criterios de §5.3, no por tendencia |

### 7.4 Lo que explícitamente NO se hará

- ❌ Migrar a React, TypeScript o Tailwind.
- ❌ Conectar con la API real del backend.
- ❌ Implementar JWT ni autenticación real.
- ❌ Implementar la lógica del chatbot.
- ❌ Tocar el backend ni la app Android.
- ❌ Añadir dependencias que no se justifiquen.

---

## 8. Organización futura de carpetas

Adaptada a HTML + CSS + JS plano (sin build step).

```
mediqr-front/
│
├── index.html                  ← entry point ÚNICO en la raíz
│                                  (resuelve A5: rutas sin "..")
│
├── css/
│   ├── tokens.css              ← :root — colores, espaciado, tipografía, radios, sombras
│   ├── base.css                ← reset, tipografía, .container, utilidades
│   ├── components.css          ← .card, .btn, .badge, .info-row, .choice, .switch, .empty-state
│   ├── layout.css              ← navbar, footer, grids responsive
│   └── views/                  ← estilos específicos de vista
│       ├── dashboard.css
│       ├── citas.css
│       ├── documentos.css
│       └── perfil.css
│
├── js/
│   ├── app.js                  ← router + arranque (punto de entrada único)
│   │
│   ├── lib/                    ← utilidades PURAS, sin acceso a document
│   │   ├── dates.js            ← fechaISO, fechaTexto, fechaCorta, horaTexto, normalizar
│   │   ├── dom.js              ← escapar, atributo, crear elemento, delegated listener
│   │   └── format.js           ← badge, infoList, emptyState
│   │
│   ├── data/                   ← DATOS. Solo lectura y simulacros. Sin DOM.
│   │   ├── mock/
│   │   │   ├── paciente.js     ← perfil, grupo sanguíneo, alergias, contactos
│   │   │   ├── citas.js        ← 9 citas + médicos + lugares
│   │   │   ├── documentos.js   ← 9 documentos
│   │   │   └── medicamentos.js ← pendiente (Fase 3)
│   │   └── store.js            ← estado en memoria + CRUD simulado
│   │                             (ÚNICO punto a sustituir por fetch() al backend)
│   │
│   ├── modules/                ← un archivo por módulo. Cada uno expone render()
│   │   ├── dashboard.js
│   │   ├── citas.js            ← extraído de citasDocumentos.js (conservar lógica)
│   │   ├── documentos.js       ← extraído de citasDocumentos.js (conservar lógica)
│   │   └── perfil.js           ← extraído del <script> inline (conservar lógica)
│   │
│   ├── components/             ← componentes reutilizables
│   │   ├── modal.js            ← ÚNICO sistema sobre <dialog> nativo (resuelve A2)
│   │   ├── toast.js            ← aviso accesible (basado en aviso())
│   │   ├── navbar.js           ← navegación y dropdowns
│   │   ├── calendar.js         ← calendario mensual reutilizable
│   │   ├── form.js             ← lectura↔edición reutilizable (resuelve duplicación)
│   │   └── qr.js               ← placeholder; implementar real cuando exista backend
│   │
│   └── config/
│       └── env.js              ← configurable por entorno (API_BASE_URL, etc.)
│
├── img/
│   ├── avatar.png              ← USAR (ya existe, resuelve A3)
│   └── (qr real: se generará dinámicamente)
│
├── AUDITORIA_FRONTEND.md
├── PLAN_IMPLEMENTACION.md
├── README.md
└── .gitignore
```

### 8.1 Reglas de la estructura

1. **Un solo punto de entrada.** `app.js` arranca todo. Nada más ejecuta código al cargar.
2. **Ningún `onclick` inline en el HTML.** Se usa delegación de eventos: `data-action="ver-documento"` + un listener raíz. Esto elimina las funciones globales y resuelve A1 y C7 de raíz.
3. **`lib/` no toca el DOM.** Si una función necesita `document`, no pertenece en `lib/`.
4. **`data/` no toca el DOM.** Es la única capa que se modificará cuando se conecte el backend.
5. **`store.js` es el futuro `api.js`.** Cuando exista el backend, se cambia `store.js` y nadie más. Esta es la razón de ser de toda la separación.
6. **CSS por Tokens → Base → Components → Layout → Views.** Ningún estilo inline salvo `grid-column: span 2` en formularios, que se reemplaza por una clase.
7. **Cero `alert()`.** Todo feedback pasa por `toast.js`.
8. **Una sola fuente de verdad para el diseño.** Todos los colores salen de `tokens.css`.

---

## 9. Plan de implementación priorizado

Cada etapa es pequeña y revisable. **Cada etapa es un commit.** Ninguna etapa empieza sin aprobación.

### Etapa 0 — Fundamentos (0.5 h) · Sin riesgo
- `git init`, `.gitignore`, primer commit del estado actual.
- **Valor:** sin esto no hay reversión posible. Es el prerrequisito de todo.
- **Validación:** `git status` limpio; `git log` muestra 1 commit.

### Etapa 1 — Eliminar código muerto (0.5 h) · Bajo
- Borrar `js/navigation.js`, `js/modalControl.js`, `js/profileEdit.js` (verificado: nunca cargados, contenido duplicado inline).
- Borrar `img/qr-sample.png` (verificado: nunca referenciado). **Mantener `img/avatar.png`** para la Etapa 4.
- Quitar `.module-tabs` de `citasDocumentos.css` (verificado: nunca usado).
- **Validación:** recargar y recorrer las 4 vistas. Idéntico comportamiento. La búsqueda de referencias confirma 0 usos.

### Etapa 2 — Corrección de bugs confirmados (4–6 h) · Bajo
- A4: `lang="es-PE"`.
- C1: definir `.btn-primary-sm` en `components.css`.
- C2: eliminar `<a>Salud ▾</a>` (o convertirlo en sección real si procede).
- C3: quitar el `▾` de Perfil.
- C7: añadir `tabindex="0"` y `role="button"` a los `<a>` que actuán de botón, o convertirlos en `<button>`.
- B2: eliminar la versión inline muerta de `switchSection` (líneas 470-483) y dejar una sola.
- **Validación:** navegación por teclado completa; "+ Agregar contacto" con estilo correcto; Citas y Documentos siguen navegables.

### Etapa 3 — Estructura de raíz y despliegue (0.5 h) · Bajo
- Mover `index.html` → `index.html`.
- Ajustar rutas a `css/…` y `js/…` (sin `..`).
- **Validación:** servir la raíz y comprobar `/` funciona; publicar con `html/` como raíz ya no es necesario. **Cierra A5.**

### Etapa 4 — Privacidad y assets (1 h) · Bajo
- A3: sustituir el `<img>` de `ui-avatars.com` por `img/avatar.png`.
- D1: autoalojar Font Awesome (o sustituir por SVG inline).
- D5: añadir `meta description` y favicon.
- **Validación:** pestaña Network sin peticiones a dominios externos; avatar renderiza correctamente.

### Etapa 5 — Sistema de modales unificado (0.5 día) · Medio
- Extraer `modal.js` basado en el `<dialog>` nativo que ya existe y funciona.
- Migrar los 5 modales de `index.html` al sistema unificado.
- Eliminar `.modal-backdrop` de `main.css`.
- **Validación:** todos abren/cierran; `Escape` funciona en todos; el foco queda dentro; se elimina `.modal-backdrop`. **Cierra A2.**

### Etapa 6 — Separación de datos, lógica y vista (1 día) · Medio
- Crear `js/lib/` (fechas, DOM, formato) extrayendo las funciones puras de `citasDocumentos.js`.
- Crear `js/data/` con los datos ficticios, **movidos literalmente sin cambios**.
- Crear `js/store.js` como única capa de acceso a datos.
- **Validación:** el comportamiento de Citas y Documentos es idéntico; `store.js` es el único archivo que contiene los datos. La lógica de `horariosDisponibles()` se conserva íntegra.

### Etapa 7 — App shell, router y navegación (1 día) · Medio
- Crear `app.js` con un router basado en `data-view`.
- Migrar a **delegación de eventos**; eliminar todos los `onclick` inline.
- Convertir las vistas en plantillas en JS, no HTML hardcodeado.
- **Validación:** navegación con teclado y con lector de pantalla; deep-link por hash; el HTML queda sin JavaScript inline.

### Etapa 8 — Sistema de diseño (1 día) · Bajo
- Extraer `tokens.css`; consolidar `.btn` (`.btn-sm` en vez de 4 variantes sueltas).
- Eliminar estilos inline (`style="grid-column: span 2"` → clase `.span-2`).
- Unificar tarjetas con `grid-column: auto` por defecto y `span-N` solo donde aplique.
- **Validación:** consistencia visual; **ningún color literal fuera de `tokens.css`**.

### Etapa 9 — Pantallas pendientes (a definir en Fase 2)
Solo después de lo anterior. Orden sugerido: **Medicamentos** → **Historial/Consultas** → **QR real** → **placeholder del chatbot**. Cada una se planifica aparte.

---

## 10. Criterios de aceptación y validaciones

### 10.1 Por etapa

| Etapa | Criterio de aceptación |
|---|---|
| **0** | `git status` sin cambios pendientes; el commit inicial contiene los 9 archivos originales |
| **1** | Las 4 vistas se ven y funcionan **igual** que antes; la búsqueda de referencias da 0 usos de los archivos eliminados |
| **2** | Se navega el portal completo solo con teclado; no queda ningún elemento interactivo sin foco; Citas y Documentos navegables; no queda más de una definición de `switchSection` |
| **3** | `GET /` sirve el portal con estilos aplicados; no hay rutas con `..` |
| **4** | La pestaña Network no muestra peticiones a dominios externos; el avatar se ve; los iconos se ven |
| **5** | Todos los modales abren y cierran; `Escape` los cierra; el foco no escapa; no queda `.modal-backdrop` en el CSS |
| **6** | Citas y Documentos se comportan igual; `store.js` es el único archivo con datos; las funciones de `lib/` no contienen `document` |
| **7** | No queda un solo `onclick` en el HTML; la navegación funciona por teclado, hash y enlace directo |
| **8** | No queda ningún color hexadecimal fuera de `tokens.css`; no queda `style="…"` en el HTML |

### 10.2 Validaciones manuales (el proyecto no tiene tests automatizados)

**Recorrido funcional completo:**
1. Inicio → 5 tarjetas renderizan.
2. Citas → Calendario: cambiar de mes, seleccionar día con cita, ver detalle.
3. Citas → Próximas: reprogramar (validar que no ofrece domingo ni hora pasada) y cancelar (validar confirmación).
4. Citas → Agendar: seleccionar especialidad → médico → fecha → hora → lugar → resumen → confirmar. Verificar que la cita aparece en el calendario.
5. Documentos: filtrar por búsqueda, tipo y rango de fechas. Subir un PDF real (verificar validación de 10 MB). Ver, descargar, eliminar.
6. Perfil: las 4 pestañas; editar información personal y médica; abrir/cerrar los 4 modales.
7. Toggles de configuración.

**Responsive:** 360 px, 414 px, 768 px, 1024 px, 1440 px. Verificar específicamente el calendario (pasa de 100 px a 52 px de alto) y los filtros de documentos (4 → 2 → 1 columnas).

**Accesibilidad:**
- Recorrido completo solo con `Tab` / `Enter` / `Escape`.
- Lector de pantalla en al menos Inicio, Citas y un modal.
- Verificar que `lang` se pronuncia como español.

**Consola:** cero errores y cero advertencias en todas las vistas.

### 10.3 Criterio de calidad general

> **Ningún cambio debe ser indistinguible del original para un usuario.** Si una etapa no cambia lo que el usuario ve o hace, se documenta y se acepta explícitamente.

---

## Anexo A — Verificación de la ejecución de B2

Método: se extrajeron los bloques `<script>` reales de `index.html` y `citasDocumentos.js` y se ejecutaron en un contexto aislado con el módulo `vm` de Node (built-in, sin instalar nada). Se reprodujo el orden de carga exacto del documento.

```
--- observed binding after load ---
index.html inline script
    -> effective switchSection = function switchSection(section) { document.getElement
js/citasDocumentos.js
    -> effective switchSection = function switchSection(section) { const vista = document.

Final effective switchSection uses the generic view-* switcher: true
```

**Conclusión:** la versión inline de `index.html` es código muerto completo. El sitio funciona por accidente del orden de carga.

---

## Anexo B — Resumen de hallazgos con prioridad

| ID | Hallazgo | Prioridad | Tipo |
|---|---|---|---|
| B1 | Sin repositorio Git | **Bloqueante** | Comprobado |
| B2 | `switchSection` duplicado; gana por orden de carga | **Bloqueante** | Comprobado (Anexo A) |
| A1 | 3 archivos JS nunca cargados | Alta | Comprobado |
| A2 | 2 sistemas de modal; solo 1 accesible | Alta | Comprobado |
| A3 | Fuga de PII a `ui-avatars.com` | Alta | Comprobado |
| A4 | `lang="en"` con contenido en español | Alta | Comprobado |
| A5 | `../css/` impide publicar `html/` como raíz | Alta | Comprobado |
| C1 | `.btn-primary-sm` usada y no definida | Media | Comprobado |
| C2 | `<a>Salud ▾</a>` muerto | Media | Comprobado |
| C3 | `▾` engañoso en Perfil | Media | Comprobado |
| C4 | 2 imágenes sin usar | Media | Comprobado |
| C5 | `.module-tabs` sin usar | Media | Comprobado |
| C6 | `alert()` como feedback | Media | Comprobado |
| C7 | `<a>`-botón no focusable | Media | Comprobado |
| D1 | CDNs externos sin SRI | Baja | Comprobado |
| D2 | `escapar()` no escapa comillas simples | Baja | Potencial |
| D3 | Object URLs sin revocar | Baja | Potencial |
| D4 | `iniciar()` no idempotente | Baja | Potencial |
| D5 | Sin metadatos ni favicon | Baja | Comprobado |
| D6 | Sin capa de datos ni manejo de errores | Baja | Potencial |
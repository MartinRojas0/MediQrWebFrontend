# MediQR — Qué falta para conectar el backend

El portal funciona entero sin servidor. Eso es deliberado: en una etapa sin
backend es fácil que una pantalla "funcione" y dé la impresión de que los
datos están guardados en algún sitio. No lo están.

Esta es la lista exacta de lo que hay que conectar, dónde está el punto de
corte en el código y qué queda preparado para conectar. Nada de esto está
simulado por dentro: cada punto dice qué se muestra hoy al paciente.

---

## 1. Cómo está cortado el código

Toda la lógica vive en `js/data/store.js`. Ese archivo es la única capa que
hay que sustituir por un cliente de API: el resto de módulos consume
`MediModules` y no sabe de dónde salen los datos.

```
js/data/store.js        <- unico punto de corte
  DATOS                 -> sustituto por llamadas al servidor
  resolverFechas()      -> recibe las fechas ya calculadas del servidor
```

`MediModules` es el estado en memoria. Cuando exista backend, debe pasar a
guardar una sesión y a hablar con la API, sin cambiar los módulos.

---

## 2. Funciones que dependen del backend

### 2.1 Autenticación

| | |
|---|---|
| **Pantalla** | `js/modules/acceso.js` (`#/acceso`, `#/acceso/registro`, `#/acceso/recuperar`) |
| **Estado hoy** | La pantalla **funciona en modo demostración**: acepta cualquier correo y contraseña y marca la sesión como activa. No hay ninguna llamada al servidor, y la propia pantalla lo dice. |
| **Qué NO se hace** | No se guarda la contraseña en ninguna parte: ni memoria, ni `localStorage`, ni `sessionStorage`, ni cookie. La sesión que se crea (`AccesoModulo.sesion`) solo guarda `activa`, `correo` y si se hizo la configuración inicial, y se pierde al recargar. Verificado en la prueba `L.16` y en `D.1` y `D.5`, que comprueban además que sin sesión no se entra al portal. |
| **Necesario** | Un endpoint que verifique credenciales, que devuelva un token y una política de renovación y cierre. La contraseña nunca debe llegar al cliente después de enviarse. |
| **Riesgo a evitar** | Bloquear los datos médicos detrás de un login que no verifica nada daría una falsa sensación de protección. |

### 2.2 Cambio de contraseña

| | |
|---|---|
| **Pantalla** | `PerfilModales.cambiarPassword()`, en `js/modules/perfil.js` |
| **Estado hoy** | Formulario visible con el botón **deshabilitado** y el motivo a la vista. |
| **Por qué** | Sin servidor de autenticación, guardar una contraseña en memoria no protegería nada y se perdería al recargar. |
| **Necesario** | El mismo sistema de autenticación del punto 2.1, con verificación de la contraseña actual. |

### 2.3 Código QR de emergencia

| | |
|---|---|
| **Pantalla** | `MediPartes.modal.verQr()`, en `js/components/modal.js` |
| **Estado hoy** | Estado "En desarrollo". **No se dibuja ningún patrón**, ni de ejemplo: en una emergencia, un QR con aspecto escaneable haría perder tiempo a un sanitario. Lo comprueban las pruebas del bloque de modales tituladas "El QR no muestra un patrón que parezca escaneable" y "El QR se declara pendiente y explica por qué". |
| **Necesario** | Generación del QR con los datos del paciente, firma para que no se pueda alterar y validación en el lado que lo escanea. |
| **Nota** | El botón "Compartir información" (`inicio:compartir`) depende de este mismo servicio. |

### 2.4 Alertas SOS

| | |
|---|---|
| **Pantalla** | `js/modules/sos.js` |
| **Estado hoy** | La cuenta atrás, la cancelación y el diálogo funcionan. La **llamada telefónica sí funciona**: es un `tel:` que resuelve el navegador, sin intervención del portal. El envío de alerta no existe y la interfaz lo dice. |
| **No cambiar** | El comportamiento de la llamada actual está verificado (`S.6`, `K.19`) y no debe tocarse al integrar el resto. |
| **Necesario** | Un servicio que reciba la alerta con la ubicación y notifique a un centro. Debe funcionar aunque el paciente no pueda hablar. |

### 2.5 Disponibilidad y reserva de citas

| | |
|---|---|
| **Pantalla** | `js/modules/citas.js` |
| **Estado hoy** | La disponibilidad es una regla local (`horariosDisponibles()`: sin domingos, sin choques, sin horas pasadas). Agendar **no reserva**: la interfaz dice "cita añadida a tu dispositivo" y que hay que confirmarla por teléfono. |
| **Necesario** | Consulta de disponibilidad real por profesional y fecha, y reserva con confirmación del centro. |
| **Restricción** | Mientras no exista, no se puede decir que una cita esté reservada. Verificado en `F.24`. |

### 2.6 Documentos

| | |
|---|---|
| **Pantalla** | `js/modules/documentos.js` |
| **Estado hoy** | Subir un archivo **funciona de verdad**: se lee el `File`, se crea su URL y se lista. Lo que no existe es el almacenamiento: se pierde al recargar y no se puede compartir con un médico. El formulario y el resultado lo dicen. |
| **Necesario** | Almacenamiento con control de acceso por paciente, cifrado en tránsito y en reposo, y caducidad de los documentos. |
| **Riesgo a evitar** | Es información médica: no puede quedar en un almacenamiento accesible por URL adivinable. |

### 2.7 Persistencia

| | |
|---|---|
| **Estado hoy** | Ninguna modificación sobrevive a recargar la página. Todo cambio avisa con `avisoLocal()`, que lo dice en pantalla. Verificado en `E.1`, `E.13`, `K.11`, `K.15`. |
| **Necesario** | Un almacén en el servidor para perfil, expediente, contactos y citas. |
| **Criterio** | El aviso local debe cambiarse **solo** cuando exista persistencia real, nunca antes. |

---

## 3. Lo que ya está preparado

- **Un solo punto de corte**: `js/data/store.js`. No hay estado repartido.
- **Sin Secrets en el cliente**: no hay claves, ni URLs de API, ni tokens.
- **Sin salidas a la red**: verificado en `G.11`. Todo lo que hoy "guarda" es local y lo declara.
- **Sin datos reales**: los datos de paciente son de demostración y no hay PII. Verificado en `P.1`-`P.5`.
- **Interfaz coherente para lo pendiente**: los estados "En desarrollo" usan un mismo patrón visual (`css/views/acceso.css`), no mensajes sueltos.
- **Pruebas que cubren el contrato**: 378 comprobaciones, incluidas las que garantizan que no se guardan contraseñas, no se sale a la red y no se promete un guardado que no ocurre.

---

## 4. Orden de integración sugerido

1. **Autenticación** — desbloquea el resto y es el requisito de todo lo demás.
2. **Persistencia del perfil y el expediente** — sustituye el `store` sin tocar las vistas.
3. **Documentos** — depende de 1 y de 2; exige decidir el modelo de acceso.
4. **Citas** — disponibilidad y reserva reales.
5. **QR y SOS** — los que tienen consecuencias en vida real; deben probarse aparte.

En cada paso, quitar el estado pendiente correspondiente **solo** cuando el
servidor responda de verdad.

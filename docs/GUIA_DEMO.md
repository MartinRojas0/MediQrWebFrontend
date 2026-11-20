# Guía de demostración local

## Demo pública del frontend

En la pantalla de acceso elige **Entrar como Pedro Demo**, **Martin Demo** o
**Verónica Demo**. No se requiere contraseña. Cada perfil tiene datos
ficticios propios para recorrer perfil, citas, consultas, expediente,
medicamentos y la vista previa de la ficha QR.

Esta ruta es solo una simulación de frontend: el rol PACIENTE no se verifica
contra el backend, no se emite un token y no se realizan llamadas a la API.
La ficha QR es ilustrativa, no escaneable y no pública. Los cambios se guardan
solo en memoria y se pierden al recargar o cerrar sesión. El formulario de
acceso habitual sigue siendo la ruta de autenticación real y conserva las
autorizaciones del backend.

## Alcance

Esta versión local usa datos ficticios y una base H2 aislada. No es un sistema
clínico y no debe recibir datos médicos reales ni usarse para decisiones
médicas o emergencias.

Las credenciales de las tres cuentas están en
[`ACCESO_DEMO.local.md`](ACCESO_DEMO.local.md), un archivo ignorado por Git.
No se incluyen en documentación pública ni en los commits.

## Iniciar el backend

En una terminal, desde la raíz del repositorio backend:

```powershell
$bytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$env:MEDIQR_DEMO_JWT_SECRET = [Convert]::ToBase64String($bytes)
$env:SPRING_PROFILES_ACTIVE = 'demo'
$env:SERVER_PORT = '8081'
$env:MEDIQR_CORS_ALLOWED_ORIGINS = 'http://127.0.0.1:8810,http://localhost:8810'
.\mvnw.cmd -Plocal-demo spring-boot:run
```

La base persiste en `data\mediqr-demo` y los bytes de documentos en
`data\documents`, relativos a la raíz del repositorio backend. Ambos
directorios son locales e ignorados por Git. Comprueba
`http://127.0.0.1:8081/api/health`.

## Iniciar el frontend

En una segunda terminal, desde la raíz del repositorio frontend:

```powershell
$env:MEDIQR_API_URL = 'http://127.0.0.1:8081/api'
npm run build
npm run serve
```

Abre <http://127.0.0.1:8810>. Para cerrar, usa `Ctrl+C` en ambas terminales.

## Recorrido sugerido

1. Inicia sesión como cada paciente; comprueba el perfil e historial propios.
2. En **Identidad médica digital**, selecciona campos, genera y descarga el QR.
   La ficha pública contiene solo los datos médicos seleccionados. Revoca el
   código al terminar la demostración.
3. En **Mis documentos**, carga un PDF/JPG/PNG ficticio, comprueba vista previa
   o descarga y elimínalo.
4. En **Citas**, consulta calendario e historial. La H2 de demo no incluye
   personal de salud activo, por lo que no permite completar una reserva en la
   interfaz. El ciclo crear/reprogramar/cancelar se cubre en la prueba backend
   `MiCitaControllerIntegrationTest`.
5. Cierra sesión antes de cambiar de paciente; el estado del usuario anterior
   se limpia.

No uses las cuentas ni archivos de esta demo en producción.

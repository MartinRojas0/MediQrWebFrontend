# Seguridad

## Autenticación y roles

- El registro público crea exclusivamente cuentas `PACIENTE`; las contraseñas
  se almacenan mediante BCrypt.
- El acceso emite JWT firmado con `JWT_SECRET`; el vencimiento configurado es
  de 24 horas. El backend usa sesiones stateless y revisa que la cuenta siga
  activa en cada petición autenticada.
- El frontend mantiene el token en memoria o `sessionStorage` según la opción
  de sesión y limpia perfil, citas, documentos y QR al cerrar sesión.
- `PACIENTE` accede a sus propios recursos. `PERSONAL_SALUD` conserva los
  controles de autorización vigentes; una junta médica por sí sola no concede
  acceso a un expediente.

## Demo pública aislada

Los botones de perfiles demo abren una sesión simulada solo en el frontend.
No emiten JWT, no llaman a la API y no representan autenticación o autorización
del servidor. Sus datos clínicos son ficticios y se borran al cerrar sesión o
recargar; no reutilices esos datos como información real.

## QR

El servidor genera un token aleatorio de 256 bits, almacena su hash SHA-256,
establece expiración de 30 días y permite revocación. La ficha pública solo
devuelve los campos médicos seleccionados; excluye identificadores, nombre,
fecha de nacimiento, teléfono y dirección. El token se entrega al emitir el QR
y no se registra intencionalmente en URLs de API.

## Documentos

Las rutas están limitadas al paciente autenticado. El backend valida tipo
permitido, firma del contenido y tamaño máximo de 10 MB; los archivos se
recuperan y eliminan por endpoints autenticados y no por enlaces públicos.
Producción requiere filesystem durable privado o almacenamiento de objetos
privado. El repositorio no implementa cifrado de archivos a nivel de aplicación;
la protección en reposo depende de la infraestructura elegida.

## Límites

Las pruebas completadas usan H2 local y datos ficticios. No se verificaron
PostgreSQL, Neon, Render ni Vercel en esta integración. No uses datos médicos
reales hasta completar revisión legal, operativa y de seguridad, y configurar
almacenamiento durable y secretos de producción.

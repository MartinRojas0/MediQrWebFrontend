# Arquitectura de MediQR

## Componentes

- **Frontend:** sitio estático HTML, CSS y JavaScript; el build inyecta
  `MEDIQR_API_URL` en `dist/js/config.js`. No usa framework ni dependencias de
  ejecución.
- **Backend:** Java 21 y Spring Boot 4.1.1; API REST, Spring Security, JWT,
  validación y Spring Data JPA.
- **Persistencia local:** H2 en archivo con el perfil `demo`; esquema JPA
  actualizado para desarrollo local.
- **Persistencia de producción:** PostgreSQL configurado por variables; el
  esquema de producción requiere migraciones manuales.
- **Documentos:** metadatos asociados al paciente en la base de datos; bytes
  guardados en el directorio privado `MEDIQR_DOCUMENT_STORAGE_DIR`.

## Comunicación

```text
Navegador
  └─ HTTPS/HTTP local → /api (JWT Bearer en rutas privadas)
       └─ Controller → Service → Repository/JPA → H2 local o PostgreSQL
```

La resolución pública del QR es la única operación del módulo QR que no usa
JWT. La ficha solo devuelve los campos médicos seleccionados; no publica
identidad, documento, fecha de nacimiento ni contacto.

Las rutas de documentos requieren autenticación y limitan cada carga a 10 MB.
Los bytes no se sirven desde una ruta pública estática. La ruta de filesystem
local es adecuada para pruebas; producción necesita almacenamiento privado y
durable.

## Áreas funcionales conectadas

- Autenticación y registro de cuentas `PACIENTE`.
- Perfil, historial clínico básico y contacto de emergencia propios.
- QR: emisión, imagen PNG, ficha pública y revocación.
- Documentos privados: carga, listado, contenido y eliminación.
- Citas: rutas propias de paciente para consulta, alta, reprogramación y
  cancelación; las operaciones de personal de salud mantienen sus permisos.

Medicamentos y recordatorios mantienen las autorizaciones existentes y no se
habilitan para pacientes por conveniencia.

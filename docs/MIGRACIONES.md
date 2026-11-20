# Migraciones de base de datos

Las migraciones manuales están en `manual-migrations/` del repositorio backend;
Spring no las ejecuta automáticamente. No se aplicaron en Neon ni en ninguna
base real.

## Orden requerido

1. `20261119_add_username.sql` — añade y valida usernames únicos normalizados.
2. `20261119_add_qr_emergency_contact.sql` — añade contacto de emergencia y
   campos de hash/expiración/revocación QR.
3. `20261120_add_documentos.sql` — crea metadatos documentales y relaciones con
   pacientes/citas; requiere que esas tablas existan con claves `BIGINT`.

Revisa `manual-migrations/README.md` y los scripts `*_rollback.sql` en el
repositorio backend para precondiciones y datos que impiden rollback. El
rollback no elimina archivos del directorio de documentos.

## Validación pendiente

En el entorno actual no había `psql`, Docker ni un servidor PostgreSQL local.
Las migraciones y sus rollbacks no se probaron; H2 en modo de compatibilidad
PostgreSQL no equivale a PostgreSQL real.

Antes de producción: respalda la base, revisa datos y esquema existente, prueba
los scripts y rollbacks en un PostgreSQL desechable equivalente, obtiene
autorización explícita y aplica en una ventana controlada. No uses Neon de
producción como base de pruebas.

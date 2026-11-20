# Despliegue

Esta guía describe configuración revisada en los repositorios; no se hizo
despliegue ni se verificaron los servicios publicados durante esta integración.

## Vercel

- Repositorio frontend: build `npm run build`, salida `dist/`.
- Configura `MEDIQR_API_URL` con la URL HTTPS del backend que se haya aprobado.
- El valor no es secreto. No uses `http://localhost` ni la URL H2 en producción.
- Las rutas usan fragmentos `#/...`; no requieren rewrites de rutas SPA.

## Render y PostgreSQL/Neon

El backend consume `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`,
`MEDIQR_CORS_ALLOWED_ORIGINS` y `MEDIQR_PUBLIC_APP_URL`. Configura CORS con el
origen exacto de Vercel y la URL pública del frontend para los QR.

No ejecutes las migraciones manuales sin respaldo, revisión y autorización. La
base PostgreSQL desechable no estaba disponible en esta máquina, así que los
scripts no fueron validados contra PostgreSQL.

## Almacenamiento privado

`render.yaml` declara `MEDIQR_DOCUMENT_STORAGE_DIR`, pero no configura un disco
persistente ni un proveedor de objetos. La implementación actual usa
filesystem; almacenamiento efímero no es aceptable para documentos médicos.
Antes de habilitar esta función en producción, configura un volumen durable
privado o integra almacenamiento de objetos privado, y valida permisos,
retención, cifrado en reposo y recuperación.

## Enlaces publicados suministrados

- Frontend: <https://mediqrwebfrontend-qahy.vercel.app>
- Backend: <https://mediqr-backend-tacn.onrender.com>
- Health: <https://mediqr-backend-tacn.onrender.com/api/health>

Son enlaces proporcionados para la versión existente; no se comprobaron ni
modificaron en esta tarea.

# Frontend deployment (Vercel)

This integration work is on `feat/integracion-final`. Do not deploy it until it
has been reviewed and the backend/database prerequisites below are resolved.
Vercel should use the repository root, run `npm run build`, and publish `dist/`.

The production frontend is available at
`https://mediqrwebfrontend-qahy.vercel.app`; its backend is
`https://mediqr-backend-tacn.onrender.com`.
These are the URLs supplied for the existing deployment; they were not checked
or changed during this local integration.

When deployment is authorized, set this environment variable in Vercel:

| Variable | Value |
| --- | --- |
| `MEDIQR_API_URL` | `https://mediqr-backend-tacn.onrender.com/api` |

This URL is public configuration, not a secret. The build fails if it is
missing or is not HTTPS. Render's `MEDIQR_CORS_ALLOWED_ORIGINS` must include
the exact frontend origin, without a trailing slash. The SPA uses hash routes,
so direct paths do not require a separate rewrite rule.

The integrated frontend connects to authenticated patient APIs for profile,
history, emergency contact, QR, documents, and appointments. Medication and
reminder permissions remain role-restricted. The QR URL uses the URL fragment,
so its token is not sent in HTTP requests or referrers.

For the local integration build:

```powershell
$env:MEDIQR_API_URL = 'http://127.0.0.1:8081/api'
npm run build
```

The generated configuration is `dist/js/config.js`. Do not commit generated
secrets or a local API URL as production configuration.

Local verification used H2 only: frontend tests/build, the headless interface
harness, and Edge against the local API completed successfully. QR issuance,
PNG generation, selected-field public resolution, and revocation were exercised
locally. Documents were uploaded, read, downloaded, and deleted through the
private API. Appointment create/reschedule/cancel and cross-patient isolation
are covered by the backend integration test. None of these results verifies
Render, Vercel, Neon, PostgreSQL compatibility, or production data.

Before publishing, review the username, QR/contact, and document metadata
migrations in the backend repository's `manual-migrations/README.md`.
Do not upload medical documents until the backend has a private durable storage
target; the current Render Blueprint declares a storage path but no persistent
disk or object-storage provider. Also set `MEDIQR_PUBLIC_APP_URL` to the exact
frontend origin and validate CORS after deployment.

# Frontend deployment (Vercel)

The real portal integration must not be promoted to production until it has
been reviewed and the backend/database prerequisites below are resolved. A
Vercel Preview is a separate, isolated demo. Vercel should use the repository
root, run `npm run build`, and publish `dist/`.
The build selects its bundle from Vercel's reserved `VERCEL_ENV` value:

- `preview`: builds the isolated demo from `index.demo.html`, `js/demo-app.js`,
  and `css/demo.css`. It does not read `MEDIQR_API_URL` or copy the real portal,
  login, or API client into `dist/`.
- `production` (and local builds): keeps the real portal build below and
  requires `MEDIQR_API_URL`.

Use `npm run build:demo` to create the isolated preview bundle locally without
setting a backend URL. Do not change the Vercel build command to select a
different project-wide variant.

The isolated Preview has only three synthetic patient profiles. It has no
password form, real authentication, backend client, or external data service.
Its profile edits and appointment additions live in memory and disappear when
the page reloads or the selected profile changes. The emergency QR screen is
an illustrative, non-scannable card.

The production frontend is available at
`https://mediqrwebfrontend-qahy.vercel.app`; its backend is
`https://mediqr-backend-tacn.onrender.com`.
These are the URLs supplied for the existing deployment; they were not checked
or changed during this local integration.

The real production build requires this public configuration variable in the
Vercel Production environment:

| Variable | Value |
| --- | --- |
| `MEDIQR_API_URL` | `https://mediqr-backend-tacn.onrender.com/api` |

The Preview build ignores this variable and does not embed its value. This URL
is public configuration, not a secret. The real build fails if it is missing
or is not HTTPS. Render's `MEDIQR_CORS_ALLOWED_ORIGINS` must include
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

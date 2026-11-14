# Frontend deployment (Vercel)

Deploy the `feat/integracion-api` branch as a static Vercel project with the
repository root as the project root. Vercel uses `npm run build` and publishes
`dist/`.

The production frontend is available at
`https://mediqrwebfrontend-qahy.vercel.app`; its backend is
`https://mediqr-backend-tacn.onrender.com`.

Set this environment variable for the Production environment in Vercel:

| Variable | Value |
| --- | --- |
| `MEDIQR_API_URL` | `https://mediqr-backend-tacn.onrender.com/api` |

This URL is public configuration, not a secret. The build fails if it is
missing or is not HTTPS. Render's `MEDIQR_CORS_ALLOWED_ORIGINS` must include
the exact origin `https://mediqrwebfrontend-qahy.vercel.app`, without a
trailing slash. That Vercel origin received HTTP 200 from `/api/health` with
the matching CORS response header on 2026-11-14.

Build locally with PowerShell:

```powershell
$env:MEDIQR_API_URL = 'https://mediqr-backend-tacn.onrender.com/api'
npm run build
```

For local development, `js/config.js` points at `http://localhost:8080/api`.

The login token is held in browser session storage and restored by validating
it with the backend on page load. Personal-profile read/update was verified in
production. The medical-history endpoint is wired but its persistence was not
verified; a new account without a history row receives `404`. Other modules
are not persistent, and the emergency QR is unavailable.

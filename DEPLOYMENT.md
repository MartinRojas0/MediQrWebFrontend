# Frontend deployment (Vercel)

Deploy the `feat/integracion-api` branch as a static Vercel project with the
repository root as the project root. Vercel uses `npm run build` and publishes
`dist/`.

Set this environment variable for the Production environment in Vercel:

| Variable | Value |
| --- | --- |
| `MEDIQR_API_URL` | Render API URL over HTTPS, ending in `/api` (e.g. `https://<service>.onrender.com/api`) |

The build fails if the API URL is missing or is not HTTPS. After Vercel creates
the production domain, add its exact origin (without a trailing slash) to
Render's `MEDIQR_CORS_ALLOWED_ORIGINS`. For local development,
`js/config.js` points at `http://localhost:8080/api`.

The login token is held in browser session storage and restored by validating
it with the backend on page load. Only the patient profile/history is synced in
this MVP; other modules are not persistent, and the emergency QR is unavailable.

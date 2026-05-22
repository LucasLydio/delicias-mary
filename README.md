# delicias-mary

Static storefront + Netlify Functions API for a small e-commerce site.

## What’s in here

- `public/`: Frontend (HTML/CSS/vanilla JS). This is what gets served as the site.
- `netlify/functions/`: Serverless endpoints (Netlify Functions). Each file maps to an endpoint.
- `backend/`: Shared backend logic used by the functions:
  - `config/`: environment/auth/storage clients (e.g., Supabase)
  - `constants/`: roles/messages and other shared constants
  - `controllers/`: request handlers (thin, HTTP-oriented)
  - `services/`: business rules/use-cases
  - `repositories/`: data access layer (DB/Supabase)
  - `utils/`: shared helpers (response/http/validation/etc.)

## Conventions (high level)

- Netlify function files should be thin wrappers: parse input → call controller/service → return a standardized response.
- Keep business logic in `backend/services/`, not in Netlify functions or controllers.
- Keep all DB/storage access in `backend/repositories/` (or `backend/config/` clients).

## Environment variables

Copy `.env.example` to `.env` and fill in the required values for your environment (Supabase/auth/storage/etc.).

## Development (typical)

- Install deps: `npm i`
- Run locally (Netlify): `netlify dev`

If you don’t use Netlify locally, you can still open `public/index.html` directly, but API calls won’t work without a local functions server.

## Deploy

Deploy to Netlify. The `public/` folder is the published site, and `netlify/functions/` are deployed as serverless functions.

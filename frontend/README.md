# Finalize Login Screen UI (Orvio Frontend)

This is a code bundle for Finalize Login Screen UI. The original project is available at https://www.figma.com/design/F2zmu6dXWu0YznAaLv3Ff2/Finalize-Login-Screen-UI.

## Running the code

1. Install dependencies: `npm i`
2. Start the development server: `npm run dev` — app runs at **http://localhost:5173**

## Backend (Orvio Backend)

Login and register use the **orvio-backend** API.

- **Development:** Frontend proxies `/api` to `http://localhost:3000`. Start the backend in its repo:
  - `cd orvio-backend && npm i && npm run dev`
- **Environment:** To use a different backend URL, set `VITE_BACKEND_URL` (e.g. in `.env`). Leave empty to use the proxy.
- **Deploy base path (optional):** If you deploy under a sub-path (example: `/orvio-ui/`), set `VITE_PUBLIC_BASE_PATH=/orvio-ui/` before build.
- **Endpoints:** `POST /auth/login`, `POST /auth/register`. Token is stored in `localStorage` and cleared on logout.

### Azure deployment defaults
- Admin frontend: `https://orvio-admin-dashboard.azurewebsites.net`
- Backend API: `https://orvio-backend.azurewebsites.net`

When `VITE_BACKEND_URL` is not provided and build mode is production, this app now defaults to `https://orvio-backend.azurewebsites.net`.

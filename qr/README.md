
  # AI Smart Cooler UI

  This is a code bundle for AI Smart Cooler UI. The original project is available at https://www.figma.com/design/a35jl3zUMrIWfxFXhvSrRd/AI-Smart-Cooler-UI.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Deployment (Azure)

  Current production URLs:
  - Backend: `https://orvio-backend.azurewebsites.net`
  - QR frontend: `https://orvio-shopping-cart.azurewebsites.net`

  Environment variables:
  - `VITE_BACKEND_URL` (optional but recommended in CI/build env): `https://orvio-backend.azurewebsites.net`

  If `VITE_BACKEND_URL` is not set, the app now falls back to the production backend URL automatically when built in production mode.
  
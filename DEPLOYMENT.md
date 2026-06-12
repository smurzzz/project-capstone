# Production Deployment

This project is split into a Vite frontend and an Express/MongoDB API.

## CI/CD pipeline

GitHub Actions is configured with two workflows:

- `.github/workflows/ci.yml` runs on every pull request and on pushes to `main` or `master`.
- `.github/workflows/deploy.yml` runs after CI succeeds on `main` or `master`, and can also be started manually from the GitHub Actions tab.

Add these GitHub repository secrets before enabling automatic deployment:

- `RENDER_DEPLOY_HOOK_URL`: Render deploy hook URL for the API service.
- `VERCEL_DEPLOY_HOOK_URL`: Vercel deploy hook URL for the frontend project.

If one deploy hook secret is missing, that deployment step is skipped. This lets you deploy only the API, only the frontend, or both.

## Required environment variables

Server:

- `PORT`
- `NODE_ENV=production`
- `MONGODB_URI` or `URI`
- `JWT_SECRET` (must be strong and not a placeholder)
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`
- `PUBLIC_APP_URL`
- `MEMBER_DISCOUNT_RATE`
- `MAIL_FROM`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `PAYMENT_GATEWAY=paymongo` and `PAYMONGO_SECRET_KEY` when live checkout is enabled

Frontend:

- `VITE_API_BASE_URL=https://your-api-domain.com/api`
- `VITE_GOOGLE_CLIENT_ID`

## Production deployment

Recommended production build steps:

1. In `server`:
   - copy `server/.env.example` to `server/.env`
   - set secure secrets in the host provider
   - run `npm ci`
   - run `npm start`

2. In `frontend`:
   - configure `VITE_API_BASE_URL` with the API base URL
   - run `npm ci`
   - run `npm run build`
   - deploy the generated `/dist` folder to Vercel or another static hosting provider

3. Confirm production readiness:
   - `NODE_ENV=production` is enabled on the server
   - `JWT_SECRET` is not a placeholder
   - `CORS_ORIGIN` only allows trusted frontend domains
   - `PUBLIC_APP_URL` matches the frontend deployment URL
   - the API health endpoint returns success at `/api/health`

4. Keep secrets out of the repository and use the hosting provider's environment manager instead of `.env` files.

For Render, Vercel, Railway, or similar hosts, the same build and start commands apply.

1. Deploy `server` to Render using the included `render.yaml`.
2. In Render, set the server environment variables listed above. Keep secrets in Render's environment manager, not in Git.
3. Deploy `frontend` to Vercel using `frontend/vercel.json`.
4. In Vercel, set `VITE_API_BASE_URL` to the production API URL plus `/api`.
5. Set `CORS_ORIGIN` on the server to the production frontend URL.
6. Add the Render and Vercel deploy hook URLs as GitHub repository secrets.
7. Push to `main` or `master`. CI will run first; deployment starts only after CI succeeds.
8. Confirm `https://your-api-domain.com/api/health` returns success before opening the frontend to users.

For another host such as Railway, Fly.io, Netlify, or a VPS, use the same build commands: `npm ci` then `npm start` in `server`, and `npm ci` then `npm run build` in `frontend`.

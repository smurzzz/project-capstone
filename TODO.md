# TODO - Security, Cleanup, Deployment Readiness

## Step 1: Hardcoded secret removal
- [x] Remove hardcoded fallback JWT secret from `server/middleware/auth.js`

## Step 2: Add environment-controlled logger
- [ ] Create `server/utils/logger.js`
- [ ] Replace debug `console.log`/`console.error` in runtime paths with logger calls (focus on non-production + sensitive logs)

## Step 3: Remove frontend debug logs
- [x] Remove debug `console.log` from `frontend/src/components/auth/GoogleAuthButton.jsx`
- [ ] Remove/guard remaining frontend `console.log` (client pages/components)

## Step 4: Verify no dev-only scripts are accidentally wired
- [ ] Ensure `server/index.js` does not import dev/debug scripts


## Step 5: Build + smoke test
- [ ] `cd server && npm start` with production env vars
- [ ] `cd frontend && npm run build`
- [ ] Smoke test auth flow



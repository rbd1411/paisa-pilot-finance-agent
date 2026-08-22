# Deploy PaisaPilot

PaisaPilot is a React/TypeScript app built with Vinext for a Cloudflare-compatible runtime. All current finance analysis runs in the browser; the demo has no database, bank connection, or server-side secret.

## Validate before deployment

Run these commands from this directory:

```powershell
npm ci
npm run build
npx tsc --noEmit
```

Do not deploy if the build or type-check fails.

## Recommended: OpenAI Sites

The repository includes `.openai/hosting.json` without a personal project ID so a new owner can create their own deployment.

1. Open this project folder in Codex.
2. Ask Codex to build, verify, and deploy the project with Sites.
3. Codex creates the Site, stores its project identifier locally, validates the production build, and publishes a version.
4. Choose private or public access when prompted. Use private access while testing with any non-fictional data.

Do not copy another person's `project_id` into `.openai/hosting.json`. It identifies a specific Sites project.

## Alternative: Cloudflare-compatible hosting

The build is configured with the Cloudflare Vite plugin and Wrangler dependencies. A production team can connect the repository to a Cloudflare Workers deployment and use `npm run build` as the build command. Review the generated `dist/` worker bundle and configure the account/project through the hosting platform; do not commit credentials.

Because Vinext is still represented as a beta dependency in this project, pin and test upgrades before production deployment. A conventional Next.js migration is another option if the chosen hosting provider does not support the current runtime.

## Production checklist

Before real financial use, add authentication, encrypted storage, user-controlled retention/deletion, consent and revocation screens, security monitoring, forecast evaluation, accessibility review, and legal/privacy review. Live account access requires an eligible, consent-based integration; never collect UPI PINs, OTPs, card credentials, or bank passwords.

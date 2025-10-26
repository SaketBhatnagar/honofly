<p align="center">
  <img src="https://pub-d2304ab3f09440e884e0b23b0e84a607.r2.dev/honofly-logo.png" alt="Honofly logo" width="160">
</p>

# Honofly

Build a real backend fast. Honofly hands you a Cloudflare Workers starter that already has Hono routing, JWT auth, RBAC, logging, Drizzle, and Docker ready to go. Less boilerplate, more shipping.

## Why devs use it

- Sick of juggling docs for Workers, Hono, Drizzle, and Docker? We wire them together.
- Need auth, logging, and RBAC on day one? Already in place.
- Want to stay flexible? The code is framework-agnostic, so Hono today, Express or Fastify tomorrow with light swaps.

## What you get

- TypeScript Hono app targeting Cloudflare Workers.
- Auth middleware with JWT issuing + RBAC guardrails.
- Drizzle + SQLite out of the box, easy swap to Postgres/MySQL.
- Docker + scripts under `app/` that make switching runtimes simple.
- Opinionated logging and error handling so prod is debuggable.

## Quick Start

```bash
npm create honofly@latest my-honofly-app
cd my-honofly-app
npm install
npm run dev
```

Need to scaffold into the current directory? Pass `.` as the project name:

```bash
npm create honofly@latest .
```

## Local Development of the CLI

```bash
# Install dependencies and link the CLI
npm install
npm link

# Generate a sample project from source
create-honofly my-demo
```

Iterate inside the `template/` directory. When you are ready to publish, bump the version in `package.json` and run `npm publish --access public`.

## Adoption & Roadmap

`sevydevy.com` already runs on this template in prod, so features are battle-tested. Next up:

- Shipping deploy presets for AWS and Vercel (Workers today, multi-cloud next).
- One-click switch between Hono, Express, and Fastify without touching business logic.
- Cleaner project structure options plus stricter DX tooling.

Because the code stays framework-agnostic, you can drop into Workers now and later slide to Express/Fastify with minimal churn. Want to help? Open an issue or PR.

<!-- <p align="center"> -->

<!-- </p> -->

<img src="https://pub-d2304ab3f09440e884e0b23b0e84a607.r2.dev/honofly.png" alt="Honofly logo" width="400">

<hr/>

[![npm](https://img.shields.io/npm/v/honofly)](https://www.npmjs.com/package/honofly)
[![npm](https://img.shields.io/npm/dm/honofly)](https://www.npmjs.com/package/honofly)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)


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

Recommended (works across npm versions):

```bash
npx honofly@latest my-honofly-app
cd my-honofly-app
npm install
npm run dev
```

Scaffold into the current directory:

```bash
npx honofly@latest .
```

Notes:
- If you have a separate package published as `create-honofly`, you can also use `npm create honofly@latest` or `npm init honofly@latest`. Those commands resolve to a package actually named `create-honofly`.
- This repository publishes the CLI as `honofly` with a `bin` entry, so `npx honofly@latest` is the most reliable invocation.

## Use the Generated App

- Start the API in dev mode: `npm run dev`
- Build for production: `npm run build`
- Run tests (if present): `npm test`

Once running, visit:
- API: `GET /` → returns `{ message: "Hello World" }`
- OpenAPI JSON: `GET /doc`
- API Reference UI: `GET /reference`

## Switch Frameworks (Hono/Express/Fastify)

The template is framework-agnostic. Choose your target via env:

- Edit `template/src/config/env.ts` and set `framework: "hono" | "express" | "fastify"`.
- Or export `FRAMEWORK` in your environment and read it in `env.ts` if you wire a loader.

Today the Hono adapter is implemented; Express/Fastify stubs are included for incremental adoption. Your route/controllers/middlewares are already framework-neutral.

## Typed Routes + Auto Docs

- Define routes in `template/src/modules/**/your.routes.ts` using the `route()` + `defineRoutes()` helpers.
- Optionally attach `docs` metadata (summary, params, requestBody, responses).
- The OpenAPI document is derived automatically at runtime from your routes and is served at `/doc` and `/reference`.

## Local Development of the CLI

```bash
# Install dependencies and link the CLI
npm install
npm link

# Generate a sample project from source
honofly my-demo
```

Iterate inside the `template/` directory. When you are ready to publish, bump the version in `package.json` and run `npm publish --access public`.

## Adoption & Roadmap

`sevydevy.com` already runs on this template in prod, so features are battle-tested. Next up:

- Shipping deploy presets for AWS and Vercel (Workers today, multi-cloud next).
- One-click switch between Hono, Express, and Fastify without touching business logic.
- Cleaner project structure options plus stricter DX tooling.

Because the code stays framework-agnostic, you can drop into Workers now and later slide to Express/Fastify with minimal churn. Want to help? Open an issue or PR.

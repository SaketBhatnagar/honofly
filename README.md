<!-- <p align="center"> -->

<!-- </p> -->

<img src="https://pub-d2304ab3f09440e884e0b23b0e84a607.r2.dev/honofly.png" alt="Honofly logo" width="400">

<hr/>

[![npm](https://img.shields.io/npm/v/honofly)](https://www.npmjs.com/package/honofly)
[![npm](https://img.shields.io/npm/dm/honofly)](https://www.npmjs.com/package/honofly)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-repo-black?logo=github)](https://github.com/SaketBhatnagar/honofly)

# Honofly 



<p >
  <strong>✈️ Build once, fly everywhere.
 Any runtime, any platform.</strong><br/>

</p>

Honofly ships a CLI + template that stands up a backend targeting Cloudflare Workers (Hono) or Node runtimes (Express/Fastify) without touching business logic twice. Typed routes, JWT auth, RBAC, logging, Drizzle, docs, and Docker are baked in so you skip boilerplate and focus on product code.

🚧 **Status: In active development.** 

## Try it now

### Scaffold a new project

```bash
npx honofly@latest my-honofly-app
cd my-honofly-app
npm install
npm run dev
```

### Scaffold into the current directory

```bash
npx honofly@latest .
```

### Pick your runtime up front

```bash
npx honofly@latest my-api --framework hono      # Cloudflare Workers (default)
npx honofly@latest my-api --framework express   # Node + Express overlay (native ESM + tsx)
npx honofly@latest my-api --framework fastify   # Node + Fastify overlay
```

- Node overlays create an `.env` with `FRAMEWORK=<name>` and `PORT=3000` so `npm run dev` just works with `tsx`.
- Workers projects rely on Wrangler (`npm run dev`, `npm run deploy`, `npm run cf-typegen`) so no `.env` is generated.

### Runtime commands

| Framework | Dev | Build / Deploy |
| --- | --- | --- |
| Hono (Workers) | `npm run dev` (Wrangler) | `npm run deploy`, `npm run cf-typegen` |
| Express | `npm run dev` (`tsx watch --env-file=.env src/index.ts`) | `npm run build` (tsc) |
| Fastify | Same as Express | Same as Express |

Health check: `GET /` returns the active framework + `x-request-id`. Docs live at `/doc` (JSON) and `/reference` (UI).

## First API in five files (copy/paste tour)

Everything you touch for a new feature lives under `template/src/modules/<feature>` plus a single export inside `template/src/all.routes.ts`. Below is a `users` example you can drop in immediately.

### 1. Schema (`template/src/modules/users/users.schema.ts`)

```ts
import { z } from "zod";

export const createUserSchema = {
  "application/json": {
    schema: z.object({
      email: z.string().email(),
      name: z.string().min(2),
    }),
  },
};
```

### 2. Data helpers (`template/src/modules/users/users.service.ts`)

```ts
type User = { id: string; email: string; name: string };
const db: User[] = [];

export async function fetchUsersFromDb(): Promise<User[]> {
  return db;
}

export async function createUserInDb(payload: Pick<User, "email" | "name">) {
  const user: User = { id: crypto.randomUUID(), ...payload };
  db.push(user);
  return user;
}
```

### 3. Controller (`template/src/modules/users/users.controller.ts`)

```ts
import type { HttpContext } from "../../types/http.types.js";
import { createUserInDb, fetchUsersFromDb } from "./users.service.js";

export async function listUsers(context: HttpContext) {
  const users = await fetchUsersFromDb();
  return context.json({ users });
}

export async function createUser(context: HttpContext) {
  const body = await context.req.json<{ email: string; name: string }>();
  const user = await createUserInDb(body);
  return context.status(201).json({ user });
}
```

### 4. Routes (`template/src/modules/users/users.routes.ts`)

```ts
import { defineRoutes, route } from "../../routes/define-routes.js";
import { listUsers, createUser } from "./users.controller.js";
import { createUserSchema } from "./users.schema.js";

export const userRoutes = defineRoutes("users", [
  route({
    method: "GET",
    path: "/users",
    handler: listUsers,
    docs: { summary: "List users" },
  }),
  route({
    method: "POST",
    path: "/users",
    handler: createUser,
    middlewares: ["requireAuth"],
    docs: {
      summary: "Create a user",
      requestBody: { content: createUserSchema },
      responses: { 201: { description: "User created" } },
    },
  }),
]);
```

### 5. Register once (`template/src/all.routes.ts`)

```ts
import { userRoutes } from "./modules/users/users.routes.js";

export const routes = [
  userRoutes,
  // other modules...
];
```

Start `npm run dev`, hit `POST /users`, and the docs at `/doc` + `/reference` update automatically regardless of framework. That’s the entire surface you edit for a new feature.

## TL;DR (why devs care)

- **No glue work:** Workers, routers, Drizzle, auth, logging, and docs are wired together out of the box.
- **Framework freedom:** Core code only imports neutral contracts—swap Hono ⇄ Express ⇄ Fastify by changing the overlay.
- **Debuggable by default:** Structured logging, consistent HttpContext helpers, and shared error translators keep prod sane.
- **Docs auto-sync:** Route metadata becomes OpenAPI JSON and a Scalar UI served at `/doc` and `/reference`.

## Current snapshot (Feb 2025)

- CLI scaffolds Hono by default and applies Express/Fastify overlays from `template/frameworks/<name>` when `--framework` is passed.
- `src/framework/server.ts` plus the `frameworks/current/*` facades enforce that the generated project matches the `FRAMEWORK` env, failing fast when misconfigured.
- Shared `HttpContext`, middleware composer, AppError translator, OpenAPI generator, JWT+RBAC middleware, Drizzle + SQLite, and Pino logging are all stable.
- Real teams (e.g., `SevyDevy`) already run Honofly in production while we finish overlay polish, framework switching UX, and cross-framework parity tests.

## Build APIs fast

1. **Pick a module folder** – Create `template/src/modules/<feature>` (copy `auth` for a skeleton).
2. **Describe routes** – Use `route()` + `defineRoutes()` in `*.routes.ts`; Honofly wires HTTP handlers and docs.
3. **Write handlers** – Controllers take the shared `HttpContext`, so the same code runs everywhere.
4. **Export the module** – Register it in `template/src/all.routes.ts` so the router + docs pick it up.
5. **Layer in docs/RBAC** – Add `docs`, `middlewares`, and `roles` metadata next to each route definition.

### Folder landmarks you’ll actually touch

```
template/src/
├─ modules/             # Feature folders (routes, controllers, services)
│  ├─ auth/
│  └─ users/
├─ middlewares/         # JWT, RBAC, logging, etc.
├─ adapters/            # HTTP/router glue (usually untouched)
├─ frameworks/current/  # Auto-swapped per framework (no manual edits)
├─ config/              # env + OpenAPI settings
└─ routes/              # Shared helpers (route(), defineRoutes())
```

## Architecture & overlays

- Every scaffold exposes framework-neutral facades under `src/frameworks/current/*` which re-export the implementation files (`hono.server.ts`, `express.server.ts`, `fastify.server.ts`). Business logic only imports from the facades.
- Framework overlays live in `template/frameworks/<framework>` and get copied into `src/frameworks/current/` when you run `honofly` with `--framework <name>`.
- Today, switching frameworks is easiest by re-running the CLI with the new `--framework`, copying your domain modules, and reinstalling dependencies. A `honofly switch --framework <name>` command that reapplies overlays in-place, updates `package.json`, and prunes runtime-specific files is on the roadmap.

## Community

We hang out on Discord—come say hi, ask questions, or share what you're building: https://discord.gg/5WdHqmReAx. If Honofly helps you ship faster, please star the repo so more folks discover it.

## Contributing

See `contribution.md` for setup steps, coding guidelines, and publishing notes.

## Adoption

[<img src="https://pub-d2304ab3f09440e884e0b23b0e84a607.r2.dev/sevydevy_logo.png" alt="sevydevy logo" width="100">](https://www.sevydevy.com/)
`SevyDevy` already runs on this template in production, so features are battle-tested even while we finish the new overlays.

## Roadmap highlights

- Contract tests to prove `HttpContext`, routing, and docs parity across Hono/Express/Fastify.
- `honofly switch --framework <name>` for in-place overlay swaps and automatic package updates.
- Express/Fastify polish: headers-sent guards, `.js` import suffixes, and clear entrypoint naming (mirroring Hono).
- Migration guides for adding new frameworks and moving existing Hono apps to Express/Fastify.
- Deployment presets beyond Cloudflare Workers (AWS, Vercel) plus opt-in observability hooks (metrics + lifecycle events).

See `TODO.md` for the full checklist and progress tracker.

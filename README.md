# create-honofly

`create-honofly` lets you scaffold a fully configured Honofly project with one command. It bundles the opinionated template that powers Honofly's JWT auth, RBAC, logging, database support, and Docker-ready deployment so you can start shipping features immediately.

## Quick start

```bash
npm create honofly@latest my-honofly-app
```

Then install dependencies and run the development server:

```bash
cd my-honofly-app
npm install
npm run dev
```

Need to use the current directory instead? Pass `.` as the project name:

```bash
npm create honofly@latest .
```

## What gets generated

- Typescript-first Cloudflare Workers setup pre-wired with Hono.
- Auth-ready stack featuring JWT, RBAC middleware, and request logging.
- Drizzle ORM + SQLite example database configuration (swapable for other backends).
- Docker files and scripts under `app/` to pivot between Hono, Express, or Nest in the future.

Explore the template code under `template/` in this repository to understand how everything fits together.

## Developing the scaffolder locally

```bash
# Link the CLI
npm install
npm link

# Test the generator
create-honofly my-demo
```

Make your changes inside the `template/` folder. When you're ready to publish a new release, update the version in `package.json` and run `npm publish --access public`.

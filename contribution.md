# Contributing to Honofly

Thanks for helping shape Honofly! This guide explains how to set up the CLI locally, where to make changes, and a few ground rules that keep the multi-framework template consistent.

## Local development workflow

```bash
npm install
npm link
honofly my-demo
```

- `npm install` pulls dependencies for the CLI + template.
- `npm link` makes the `honofly` binary available globally so you can test against real scaffolds.
- `honofly my-demo` generates a sample project from your local source; rerun this whenever you change the template or overlays.

## Where to make changes

| Area | Touch these paths |
| --- | --- |
| Framework-agnostic template | `template/src/**`, `template/routes/**`, `template/modules/**`, `template/middlewares/**` |
| Framework overlays (Express/Fastify/etc.) | `template/frameworks/<name>/src/frameworks/current/*` |
| CLI behavior | `bin/create-honofly.js` |
| Roadmap / status | `TODO.md` |

## Coding guidelines

- Keep naming neutral in shared code: prefer `context.*.ts`, `logger.*.ts`, `server.*.ts` so imports stay portable.
- Route every framework-specific import through `src/frameworks/current/*`; only the overlay should import `express`, `fastify`, or `hono` directly.
- Add or update tests when touching shared contracts (`HttpContext`, middleware composer, routing adapters, docs generator).
- Follow the existing TypeScript style (ESM modules, `FRAMEWORK` env guard rails) and document any non-obvious decisions in comments or the README.

## Branching and commit style

- **Branch names**: use lowercase kebab-case and describe the scope, e.g., `feature/add-auth`, `fix/race-condition`, `chore/deps-2024-05`. Include an issue number when one exists (`feature/42-add-auth`) so references stay traceable.
- **Prefixes**: pick a meaningful prefix (`feature`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `ci`, `build`, `revert`). If a change spans multiple areas, default to the primary user impact: a new user-facing capability should still use `feature/…` even if it touches docs.
- **Commit messages**: follow Conventional Commits (`type(scope): summary`). Keep scope optional but short (`feat(auth): add refresh tokens`). Write the summary in the imperative mood and limit to ~72 characters.
- **Example**: branch `feature/add-auth-refresh` → commit `feat(auth): add refresh token rotation` with a body explaining the flow and referencing `Closes #42`.
- **Types explained**:
  - `feat`: a new feature or enhancement visible to users (CLI flags, template modules, etc.).
  - `fix`: bug fixes, regressions, or stability patches.
  - `docs`: README, contribution guide, or template documentation-only updates.
  - `chore`: maintenance, dependency bumps, or repo plumbing with no runtime effect.
  - `refactor`: code changes that neither fix a bug nor add a feature (e.g., reorganizing modules).
  - `perf`: performance improvements.
  - `test`: adding or updating automated tests without modifying production logic.
  - `build`/`ci`: build tooling, release scripts, or CI configuration tweaks.
  - `revert`: revert a previous commit; include the hash in the body.
- **Commit body**: explain the “why” for complex changes, list breaking changes under a `BREAKING CHANGE:` footer, and reference issues with `Closes #123`.

## Publishing checklist

1. Update `package.json` version.
2. Regenerate a sample project and smoke test `npm run dev` for the targeted framework(s).
3. Run formatting/tests (e.g., `npm run lint` or `npm test` if available).
4. Run `npm publish --access public`.
5. Tag the release and share updates in Discord.

Questions? Open an issue or drop a note in Discord: https://discord.gg/5WdHqmReAx.

import { Hono } from "hono";
import { allRoutes, createDocsRoutes } from "../all.routes";
import { registerRoutes } from "../adapters/registerRouters.adapter";
import { env } from "../config/env";
import { translateError } from "../errors/translator";
import { createHonoLogger } from "../utils/logger.hono";

export const createHonoApp = () => {
	const app = new Hono({
		// Explicitly set the environment type for Cloudflare Workers
		strict: true,
	});

	const framework = env.framework;
	// Attach request logging before routes so every handler inherits request id + child logger.
	app.use("*", createHonoLogger());

	// Docs should always be at /doc and /reference; app routes can move under env.routePrefix (e.g. /api/v1/users).
	const docsRoutes = createDocsRoutes({ basePath: env.routePrefix });
	registerRoutes(app, docsRoutes, framework);
	// Apply optional route prefixes before handing configuration to Hono.
	registerRoutes(app, allRoutes, framework, { prefix: env.routePrefix });

	app.onError((err, c) => {
		console.error(err);
		const translated = translateError(err);

		return c.json(translated.body, translated.status);
	});

	return app;
};

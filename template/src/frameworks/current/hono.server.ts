import { Hono } from "hono";
import { allRoutes, createDocsRoutes } from "../../all.routes.js";
import { registerRoutes } from "../../adapters/registerRouters.adapter.js";
import { env } from "../../config/env.js";
import { translateError } from "../../errors/translator.js";
import { createLogger, type FrameworkLogger } from "./hono.logger.js";
import { frameworkId } from "./hono.manifest.js";

export type FrameworkApp = ReturnType<typeof createApp>;

export function createApp(logger: FrameworkLogger = createLogger()) {
  const app = new Hono({
    strict: true,
  });

  const framework = env.framework ?? frameworkId;

  app.use("*", logger);

  const docsRoutes = createDocsRoutes({ basePath: env.routePrefix });
  registerRoutes(app, docsRoutes, framework);
  registerRoutes(app, allRoutes, framework, { prefix: env.routePrefix });

  app.onError((err, c) => {
    console.error(err);
    const translated = translateError(err);

    return c.json(translated.body as any, translated.status as any);
  });

  return app;
}

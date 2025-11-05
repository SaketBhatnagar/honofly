import express from "express";
import type { Request, Response, NextFunction } from "express";
import { allRoutes, createDocsRoutes } from "../../all.routes.js";
import { registerRoutes } from "../../adapters/registerRouters.adapter.js";
import { env } from "../../config/env.js";
import { translateError } from "../../errors/translator.js";
import { createLogger, type FrameworkLogger } from "./express.logger.js";
import { frameworkId } from "./express.manifest.js";

export type FrameworkApp = ReturnType<typeof createApp>;

export function createApp(logger: FrameworkLogger = createLogger()) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (logger) {
    app.use(logger);
  }

  const docsRoutes = createDocsRoutes({ basePath: env.routePrefix });
  registerRoutes(app, docsRoutes, frameworkId);
  registerRoutes(app, allRoutes, frameworkId, { prefix: env.routePrefix });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const translated = translateError(error);
    res.status(translated.status).json(translated.body);
  });

  return app;
}

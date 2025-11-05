import Fastify from "fastify";
import { allRoutes, createDocsRoutes } from "../../all.routes.js";
import { registerRoutes } from "../../adapters/registerRouters.adapter.js";
import { env } from "../../config/env.js";
import { translateError } from "../../errors/translator.js";
import { createLogger, type FrameworkLoggerConfiguration } from "./fastify.logger.js";
import { frameworkId } from "./fastify.manifest.js";

export type FrameworkApp = ReturnType<typeof createApp>;

export function createApp(loggerConfig?: FrameworkLoggerConfiguration) {
  const resolvedLogger = loggerConfig ?? createLogger();
  const fastify = Fastify({
    logger: resolvedLogger.logger ?? false,
    disableRequestLogging: resolvedLogger.disableRequestLogging ?? false,
  });

  if (resolvedLogger) {
    resolvedLogger.register(fastify as any);
  }

  const docsRoutes = createDocsRoutes({ basePath: env.routePrefix });
  registerRoutes(fastify, docsRoutes, frameworkId);
  registerRoutes(fastify, allRoutes, frameworkId, { prefix: env.routePrefix });

  fastify.setErrorHandler((error, request, reply) => {
    const translated = translateError(error);
    reply.status(translated.status).send(translated.body);
  });

  return fastify;
}

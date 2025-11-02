import { env } from "../config/env";
import { createHonoApp } from "./hono.server";
import { Framework } from "../types/http.types";
import type { LoggerForFramework } from "../utils/logger";

interface CreateServerOptions<F extends Framework> {
  logger?: LoggerForFramework<F>;
}

export function createServer<F extends Framework>(
  framework?: F,
  options: CreateServerOptions<F> = {}
) {
  const target: Framework = framework ?? env.framework;

  switch (target) {
    case "hono":
      return createHonoApp(options.logger as LoggerForFramework<"hono"> | undefined);
    case "express":
      throw new Error(
        "Express bootstrap not implemented yet. Add framework/express.server.ts and wire it here."
      );
    case "fastify":
      throw new Error(
        "Fastify bootstrap not implemented yet. Add framework/fastify.server.ts and wire it here."
      );
    default:
      // Enforce explicit error for unsupported values
      throw new Error(
        `Unsupported framework: ${String(target)}. Allowed: 'hono' | 'express' | 'fastify'.`
      );
  }
}

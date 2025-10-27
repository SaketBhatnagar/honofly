import { env } from "../config/env";
import { createHonoApp } from "./hono.server";

type Framework = "hono" | "express" | "fastify";

export function createServer(framework?: Framework) {
  const target: Framework = framework ?? env.framework;

  switch (target) {
    case "hono":
      return createHonoApp();
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


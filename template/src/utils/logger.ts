import type { Framework } from "../types/http.types";
import type { ExpressLogger } from "./logger.express";
import type { FastifyLoggerConfiguration } from "./logger.fastify";
import { createHonoLogger, type HonoLogger } from "./logger.hono";
import type { LoggerOptions } from "./logger.shared";

export type LoggerForFramework<F extends Framework> = F extends "hono"
  ? HonoLogger
  : F extends "express"
    ? ExpressLogger
    : F extends "fastify"
      ? FastifyLoggerConfiguration
      : never;


const isNodeRuntime =
  typeof globalThis.process !== "undefined" && globalThis.process?.release?.name === "node";

export async function getLogger<F extends Framework>(
  framework: F,
  options?: LoggerOptions
): Promise<LoggerForFramework<F>> {
  switch (framework) {
    case "hono":
      // Cloudflare path relies on the lightweight Worker-safe middleware.
      return createHonoLogger(options) as LoggerForFramework<F>;
    case "express":
      if (!isNodeRuntime) {
        throw new Error("Express logger is only available in a Node.js runtime.");
      }
      {
        // Lazy-load the Node-specific logger to keep Workers bundles free of pino-http.
        const module = await import("./logger.express");
        return module.createExpressLogger(options) as LoggerForFramework<F>;
      }
    case "fastify":
      if (!isNodeRuntime) {
        throw new Error("Fastify logger is only available in a Node.js runtime.");
      }
      {
        // Fastify also relies on Node internals, so import it only when available.
        const module = await import("./logger.fastify");
        return module.createFastifyLogger(options) as LoggerForFramework<F>;
      }
    default:
      throw new Error(`Unsupported framework for logger: ${String(framework)}`);
  }
}

export type { HonoLogger, ExpressLogger, FastifyLoggerConfiguration };
export type { LoggerOptions } from "./logger.shared";
export {
  DEFAULT_REQUEST_ID_HEADER,
  ensureRequestId,
  normalizeHeaderName,
  createPinoConfig,
  createPinoInstance,
  statusToLevel,
} from "./logger.shared";

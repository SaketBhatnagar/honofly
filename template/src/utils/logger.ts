import type { Framework } from "../types/http.types";
import { createExpressLogger, type ExpressLogger } from "./logger.express";
import { createFastifyLogger, type FastifyLoggerConfiguration } from "./logger.fastify";
import { createHonoLogger, type HonoLogger } from "./logger.hono";
import type { LoggerOptions } from "./logger.shared";

export type LoggerForFramework<F extends Framework> = F extends "hono"
  ? HonoLogger
  : F extends "express"
    ? ExpressLogger
    : F extends "fastify"
      ? FastifyLoggerConfiguration
      : never;


export function getLogger(framework: "hono", options?: LoggerOptions): LoggerForFramework<"hono">;
export function getLogger(framework: "express", options?: LoggerOptions): LoggerForFramework<"express">;
export function getLogger(framework: "fastify", options?: LoggerOptions): LoggerForFramework<"fastify">;
export function getLogger(framework: Framework, options?: LoggerOptions): LoggerForFramework<Framework> {
  switch (framework) {
    case "hono":
      // Cloudflare path relies on the lightweight Worker-safe middleware.
      return createHonoLogger(options) as LoggerForFramework<Framework>;
    case "express":
      // Node.js frameworks use pino-http to wire themselves into request/response lifecycles.
      return createExpressLogger(options) as LoggerForFramework<Framework>;
    case "fastify":
      // Fastify consumes a registration helper that adds hooks with shared logging semantics.
      return createFastifyLogger(options) as LoggerForFramework<Framework>;
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

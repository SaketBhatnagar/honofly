import type { Logger } from "pino";
import type { LoggerOptions } from "./logger.shared";
import {
  DEFAULT_REQUEST_ID_HEADER,
  createPinoInstance,
  ensureRequestId,
  normalizeHeaderName,
  statusToLevel,
} from "./logger.shared";

type FastifyInstance = {
  addHook: (name: string, handler: (...args: any[]) => unknown) => void;
};

type FastifyRequest = {
  headers?: Record<string, any>;
  raw?: { url?: string };
  url?: string;
  method: string;
  id?: string;
  log?: Logger;
  [key: string]: unknown;
};

type FastifyReply = {
  statusCode?: number;
  raw?: { statusCode?: number };
  header: (name: string, value: string) => void;
  log?: Logger;
  [key: string]: unknown;
};

export type FastifyLoggerConfiguration = {
  logger: Logger;
  disableRequestLogging: boolean;
  register(instance: FastifyInstance): void;
};

export function createFastifyLogger(options?: LoggerOptions): FastifyLoggerConfiguration {
  const logger = createPinoInstance("fastify", options);
  const requestIdHeader = options?.requestIdHeader ?? DEFAULT_REQUEST_ID_HEADER;
  const normalizedHeader = normalizeHeaderName(requestIdHeader);

  return {
    logger,
    disableRequestLogging: true,
    register(instance: FastifyInstance) {
      instance.addHook("onRequest", (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
        // Capture or mint the request id as soon as Fastify sees the request.
        const headerValue = request.headers?.[requestIdHeader] ?? request.headers?.[normalizedHeader];
        const requestId = ensureRequestId(headerValue as string | undefined);

        if (request.headers) {
          request.headers[requestIdHeader] = requestId;
          request.headers[normalizedHeader] = requestId;
        }

        request.id = requestId;
        (request as any)._requestStart = Date.now();
        (request as any)._loggerErrored = false;

        reply.header(requestIdHeader, requestId);

        const child = logger.child({ requestId });
        request.log = child;
        reply.log = child;

        done();
      });

      instance.addHook("onResponse", (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
        if ((request as any)._loggerErrored) {
          done();
          return;
        }

        // Emit completion metrics once the response finishes streaming out.
        const statusCode = reply.statusCode ?? reply.raw?.statusCode ?? 200;
        const start = (request as any)._requestStart as number | undefined;
        const duration = typeof start === "number" ? Date.now() - start : undefined;
        const requestId = request.id as string | undefined;
        const child = request.log ?? logger.child({ requestId });
        const level = statusToLevel(statusCode);
        const logFn =
          level === "info"
            ? child.info.bind(child)
            : level === "warn"
              ? child.warn.bind(child)
              : child.error.bind(child);

        logFn(
          {
            request: {
              method: request.method,
              path: (request.raw?.url ?? request.url) ?? "",
            },
            response: {
              statusCode,
            },
            responseTimeMs: duration,
          },
          "request completed",
        );

        done();
      });

      instance.addHook(
        "onError",
        (request: FastifyRequest, reply: FastifyReply, error: unknown, done: () => void) => {
          // Ensure failures are always logged even if Fastify short-circuits the lifecycle.
          const statusCode = reply.statusCode ?? reply.raw?.statusCode ?? 500;
          const start = (request as any)._requestStart as number | undefined;
          const duration = typeof start === "number" ? Date.now() - start : undefined;
          const child = request.log ?? logger.child({ requestId: request.id });

          child.error(
            {
              err: error,
              request: {
                method: request.method,
                path: (request.raw?.url ?? request.url) ?? "",
              },
              response: {
                statusCode,
              },
              responseTimeMs: duration,
            },
            "request failed",
          );

          (request as any)._loggerErrored = true;

          done();
        },
      );
    },
  };
}

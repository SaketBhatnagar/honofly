import type { MiddlewareHandler } from "hono";
import type { LoggerOptions } from "./logger.shared";
import {
  DEFAULT_REQUEST_ID_HEADER,
  createPinoInstance,
  ensureRequestId,
  statusToLevel,
} from "./logger.shared";

export type HonoLogger = MiddlewareHandler;

export function createHonoLogger(options?: LoggerOptions): HonoLogger {
  const logger = createPinoInstance("hono", options);
  const requestIdHeader = options?.requestIdHeader ?? DEFAULT_REQUEST_ID_HEADER;
  const fallbackHeader = requestIdHeader.toLowerCase();

  return async (context, next) => {
    // Wrap each request to mint a request id, attach a child logger, and push timing/status metadata.
    const start = Date.now();
    const incomingId =
      context.req.raw.headers.get(requestIdHeader) ?? context.req.raw.headers.get(fallbackHeader) ?? undefined;
    const requestId = ensureRequestId(incomingId ?? undefined);

    try {
      context.req.raw.headers.set(requestIdHeader, requestId);
    } catch (error) {
      logger.trace({ err: error, requestId }, "unable to set request header for request id");
    }

    context.set("requestId", requestId);

    const requestLogger = logger.child({ requestId });
    context.set("logger", requestLogger);

    const requestInfo = {
      method: context.req.method,
      path: context.req.path,
    };

    try {
      const response = (await next()) as Response | undefined;
      const targetResponse = response ?? context.res;
      const statusCode = targetResponse?.status ?? 200;
      const duration = Date.now() - start;
      const level = statusToLevel(statusCode);
      const payload = {
        request: requestInfo,
        response: {
          statusCode,
        },
        responseTimeMs: duration,
      };

      if (targetResponse) {
        try {
          targetResponse.headers.set(requestIdHeader, requestId);
        } catch (error) {
          requestLogger.trace({ err: error, requestId }, "unable to set response header for request id");
        }
      } else {
        context.header(requestIdHeader, requestId);
      }

      const logFn = level === "info" ? requestLogger.info.bind(requestLogger) : level === "warn" ? requestLogger.warn.bind(requestLogger) : requestLogger.error.bind(requestLogger);

      logFn(payload, "request completed");

      return response;
    } catch (error) {
      // Errors bubble up, but we still enrich the log record with failure details and timing.
      const duration = Date.now() - start;
      const payload = {
        request: requestInfo,
        response: {
          statusCode: 500,
        },
        responseTimeMs: duration,
        err: error,
      };

      requestLogger.error(payload, "request failed");
      context.header(requestIdHeader, requestId);

      throw error;
    }
  };
}

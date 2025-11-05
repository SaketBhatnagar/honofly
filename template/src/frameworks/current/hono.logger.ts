import type { LoggerOptions } from "../../utils/logger.shared.js";
import {
  DEFAULT_REQUEST_ID_HEADER,
  createPinoInstance,
  ensureRequestId,
  statusToLevel,
} from "../../utils/logger.shared.js";

// Minimal subset of the Hono context we touch so the template stays framework-agnostic.
type HonoContext = {
  req: {
    raw: Request;
    method: string;
    path: string;
  };
  res: Response | undefined;
  set: (key: string, value: unknown) => void;
  get: <T = unknown>(key: string) => T | undefined;
  header: (name: string, value: string) => void;
};

type HonoNext = () => Promise<void>;

// Match Hono's middleware contract: next resolves to void and handlers may bubble a Response.
export type FrameworkLogger = (context: HonoContext, next: HonoNext) => Promise<Response | void>;

export function createLogger(options?: LoggerOptions): FrameworkLogger {
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
      const result = (await next()) as unknown as Response | undefined;
      const targetResponse = context.res ?? result;
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

      const logFn =
        level === "info"
          ? requestLogger.info.bind(requestLogger)
          : level === "warn"
            ? requestLogger.warn.bind(requestLogger)
            : requestLogger.error.bind(requestLogger);

      logFn(payload, "request completed");

      return result;
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

import pinoHttp, { type Options as PinoHttpOptions } from "pino-http";
import type { LoggerOptions } from "./logger.shared";
import {
  DEFAULT_REQUEST_ID_HEADER,
  createPinoInstance,
  ensureRequestId,
  normalizeHeaderName,
  statusToLevel,
} from "./logger.shared";

export type ExpressLogger = ReturnType<typeof pinoHttp>;

export function createExpressLogger(options?: LoggerOptions): ExpressLogger {
  const requestIdHeader = options?.requestIdHeader ?? DEFAULT_REQUEST_ID_HEADER;
  const normalizedHeader = normalizeHeaderName(requestIdHeader);
  const logger = createPinoInstance("express", options);

  const config: PinoHttpOptions = {
    logger,
    genReqId(req, res) {
      // Prefer inbound x-request-id but fall back to a generated uuid for correlation.
      const headerValue = (req.headers?.[requestIdHeader] as string) ?? (req.headers?.[normalizedHeader] as string);
      const requestId = ensureRequestId(headerValue);

      if (req.headers) {
        (req.headers as Record<string, string>)[requestIdHeader] = requestId;
        (req.headers as Record<string, string>)[normalizedHeader] = requestId;
      }
      (req as any).id = requestId;

      if (typeof res.setHeader === "function") {
        res.setHeader(requestIdHeader, requestId);
      }

      if (!res.locals || typeof res.locals !== "object") {
        (res as any).locals = {};
      }

      (res.locals as Record<string, string>).requestId = requestId;

      return requestId;
    },
    customProps(req) {
      // Bubble the request id into every log entry emitted by pino-http.
      return {
        requestId: (req as any).id ?? (req.headers?.[normalizedHeader] as string),
      };
    },
    customSuccessMessage() {
      return "request completed";
    },
    customErrorMessage() {
      return "request failed";
    },
    customLogLevel(req, res, err) {
      if (err) {
        return "error";
      }

      // Align success log levels with HTTP status ranges so noisy endpoints stay at info.
      const statusCode = typeof res.statusCode === "number" ? res.statusCode : 500;
      return statusToLevel(statusCode);
    },
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
        };
      },
      res(response) {
        return {
          statusCode: response.statusCode,
        };
      },
    },
  } satisfies PinoHttpOptions;

  return pinoHttp(config);
}

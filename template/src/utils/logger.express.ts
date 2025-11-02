import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import pinoHttp, { type HttpLogger, type Options as PinoHttpOptions } from "pino-http";
import type { LoggerOptions } from "./logger.shared";
import {
  DEFAULT_REQUEST_ID_HEADER,
  createPinoInstance,
  ensureRequestId,
  normalizeHeaderName,
  statusToLevel,
} from "./logger.shared";

type RequestWithId = ExpressRequest & {
  id?: string;
};

type ResponseWithLocals = ExpressResponse & {
  locals: Record<string, unknown>;
};

export type ExpressLogger = HttpLogger;

export function createExpressLogger(options?: LoggerOptions): ExpressLogger {
  const requestIdHeader = options?.requestIdHeader ?? DEFAULT_REQUEST_ID_HEADER;
  const normalizedHeader = normalizeHeaderName(requestIdHeader);
  const logger = createPinoInstance("express", options);

  const config: PinoHttpOptions = {
    logger,
    genReqId(req, res) {
      const typedReq = req as RequestWithId;
      const typedRes = res as ResponseWithLocals;

      // Prefer inbound x-request-id but fall back to a generated uuid for correlation.
      const headerValue =
        (typedReq.headers?.[requestIdHeader] as string) ??
        (typedReq.headers?.[normalizedHeader] as string);
      const requestId = ensureRequestId(headerValue);

      if (typedReq.headers) {
        (typedReq.headers as Record<string, string>)[requestIdHeader] = requestId;
        (typedReq.headers as Record<string, string>)[normalizedHeader] = requestId;
      }
      typedReq.id = requestId;

      if (typeof typedRes.setHeader === "function") {
        typedRes.setHeader(requestIdHeader, requestId);
      }

      if (!typedRes.locals || typeof typedRes.locals !== "object") {
        typedRes.locals = {};
      }

      typedRes.locals.requestId = requestId;

      return requestId;
    },
    customProps(req) {
      // Bubble the request id into every log entry emitted by pino-http.
      return {
        requestId: (req as RequestWithId).id ?? (req.headers?.[normalizedHeader] as string),
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

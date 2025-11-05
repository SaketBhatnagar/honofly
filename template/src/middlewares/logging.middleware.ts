import { HttpContext, Middleware, ResponseHelpers } from "../types/http.types.js";

type MethodKeys = keyof ResponseHelpers;

type ResponseInterceptor = {
  method: MethodKeys;
  extractStatus: (...args: unknown[]) => number | undefined;
};

const TERMINAL_INTERCEPTORS: ResponseInterceptor[] = [
  { method: "json", extractStatus: (_, status) => (typeof status === "number" ? status : undefined) },
  { method: "text", extractStatus: (_, status) => (typeof status === "number" ? status : undefined) },
  { method: "html", extractStatus: (_, status) => (typeof status === "number" ? status : undefined) },
  { method: "blob", extractStatus: (_, status) => (typeof status === "number" ? status : undefined) },
  { method: "stream", extractStatus: (_, status) => (typeof status === "number" ? status : undefined) },
  { method: "send", extractStatus: (_, status) => (typeof status === "number" ? status : undefined) },
  {
    method: "redirect",
    extractStatus: (_, status) => {
      if (typeof status === "number") {
        return status;
      }
      // Default redirect status mirrors popular frameworks when unspecified.
      return 302;
    },
  },
];

const CHAIN_INTERCEPTORS: ResponseInterceptor[] = [
  { method: "status", extractStatus: (code) => (typeof code === "number" ? code : undefined) },
  {
    method: "header",
    extractStatus: () => undefined,
  },
];

function wrapResponseHelpers(res: ResponseHelpers, trackStatus: (code: number | undefined) => void) {
  const chainReturn = <T>(value: T): T => value;

  const wrap = <K extends MethodKeys>(method: K, interceptor?: ResponseInterceptor) => {
    const original = res[method];

    if (typeof original !== "function") {
      return;
    }

    res[method] = ((...args: unknown[]) => {
      if (interceptor) {
        trackStatus(interceptor.extractStatus(...args));
      }

      const result = (original as (...params: unknown[]) => unknown).apply(res, args);

      return chainReturn(result);
    }) as ResponseHelpers[K];
  };

  TERMINAL_INTERCEPTORS.forEach((interceptor) => wrap(interceptor.method, interceptor));
  CHAIN_INTERCEPTORS.forEach((interceptor) => wrap(interceptor.method, interceptor));
}

function formatDuration(deltaMs: number) {
  if (deltaMs < 1000) {
    return `${deltaMs.toFixed(0)}ms`;
  }

  return `${(deltaMs / 1000).toFixed(2)}s`;
}

const DEFAULT_STATUS = 200;

// Captures request lifecycle metrics once for every framework since the middleware runs post-normalization.
export const loggingMiddleware: Middleware = async (context: HttpContext) => {
  const { req, res, framework } = context;
  const start = Date.now();
  const requestLogger = context.get<any>("logger");
  const requestId = context.get<string>("requestId");

  let statusCode: number | undefined;
  let nextInvoked = false;

  const updateStatus = (code: number | undefined) => {
    if (typeof code === "number") {
      statusCode = code;
    }
  };

  const originalNext = context.next;
  context.next = async () => {
    nextInvoked = true;
    return originalNext();
  };

  wrapResponseHelpers(res, updateStatus);

  const logPrefix = `[${framework}] ${req.method.toUpperCase()} ${req.path}`;

  const emitLog = (level: "info" | "warn" | "error", payload: Record<string, unknown>, message: string) => {
    if (requestLogger && typeof requestLogger[level] === "function") {
      // Prefer the framework-provided logger when available so logs inherit structured metadata.
      requestLogger[level](payload, message);
      return;
    }

    const base = `${logPrefix} - ${message}`;
    const suffix = requestId ? ` [requestId=${requestId}]` : "";

    if (level === "error") {
      console.error(base + suffix, payload.err ?? payload);
      return;
    }

    if (level === "warn") {
      console.warn(base + suffix, payload);
      return;
    }

    console.log(base + suffix, payload);
  };

  try {
    const result = await context.next();

    if (!nextInvoked) {
      emitLog(
        "warn",
        { reason: "middleware chain short-circuited" },
        "middleware chain short-circuited before hitting the next handler.",
      );
    }

    const duration = Date.now() - start;
    const status = statusCode ?? DEFAULT_STATUS;
    emitLog(
      status >= 400 ? "warn" : "info",
      { statusCode: status, responseTimeMs: duration },
      `completed in ${formatDuration(duration)}`,
    );

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    const status = statusCode ?? 500;
    emitLog(
      "error",
      { statusCode: status, responseTimeMs: duration, err: error },
      `failed after ${formatDuration(duration)}`,
    );

    throw error;
  }
};

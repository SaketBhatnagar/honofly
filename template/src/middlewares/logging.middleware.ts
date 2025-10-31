import { HttpContext, Middleware, ResponseHelpers } from "../types/http.types";

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

  try {
    const result = await context.next();

    if (!nextInvoked) {
      console.warn(`${logPrefix} -> middleware chain short-circuited before hitting the next handler.`);
    }

    const duration = Date.now() - start;
    const status = statusCode ?? DEFAULT_STATUS;

    console.log(`${logPrefix} -> ${status} (${formatDuration(duration)})`);

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    const status = statusCode ?? 500;

    console.error(`${logPrefix} -> ${status} (failed after ${formatDuration(duration)})`, error);

    throw error;
  }
};

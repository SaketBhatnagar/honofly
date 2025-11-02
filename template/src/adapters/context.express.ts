import { DEFAULT_REQUEST_ID_HEADER } from "../utils/logger.shared";
import { Framework, HttpContext, ResponseHelpers } from "../types/http.types";

type HeaderRecord = Record<string, string | string[] | undefined>;

function normalizeRecord<T>(input: Record<string, T> | undefined | null): Record<string, T> {
  if (!input) {
    return {};
  }

  return Object.entries(input).reduce<Record<string, T>>((acc, [key, value]) => {
    // Normalize keys for parity with other frameworks and HTTP conventions.
    acc[key.toLowerCase()] = value;
    return acc;
  }, {});
}

function normalizeQuery(input: Record<string, unknown> | undefined | null): Record<string, string | string[]> {
  if (!input) {
    return {};
  }

  return Object.entries(input).reduce<Record<string, string | string[]>>((acc, [key, value]) => {
    const lowerKey = key.toLowerCase();

    if (Array.isArray(value)) {
      acc[lowerKey] = value.map((item) => String(item));
      return acc;
    }

    if (value === undefined || value === null) {
      acc[lowerKey] = "";
      return acc;
    }

    if (typeof value === "object") {
      acc[lowerKey] = [JSON.stringify(value)];
      return acc;
    }

    acc[lowerKey] = String(value);
    return acc;
  }, {});
}

function normalizeHeaders(headers: HeaderRecord): Record<string, string> {
  return Object.entries(headers ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value === undefined) {
      return acc;
    }

    const normalizedKey = key.toLowerCase();
    // Collapse multi-value headers into the standard comma-separated form.
    acc[normalizedKey] = Array.isArray(value) ? value.join(", ") : String(value);
    return acc;
  }, {});
}

function createBodyAccessor<T>(loader: () => Promise<T>): () => Promise<T> {
  let cached: { value: T } | undefined;
  let inflight: Promise<T> | undefined;

  return async () => {
    if (cached) {
      return cached.value;
    }

    if (!inflight) {
      // Lazy-load and memoize body parsing to align with streaming semantics.
      inflight = loader().then((value) => {
        cached = { value };
        return value;
      });
    }

    return inflight;
  };
}

// Adapt Express request/response objects to the shared HttpContext surface.
export function buildExpressContext(...params: any[]): HttpContext {
  const [req, res, next] = params;
  const framework: Framework = "express";
  const store = new Map<string, unknown>();

  const requestLogger = (req as any).log;
  const requestId = (req as any).id ?? res?.locals?.requestId;

  if (requestLogger) {
    // Expose the request-scoped logger via context.get("logger").
    store.set("logger", requestLogger);
  }

  if (requestId) {
    // Mirror the id so downstream handlers can correlate logs outside of pino.
    store.set("requestId", requestId);
  }

  const responseHelpers: ResponseHelpers = {
    json: (data, status) => {
      if (typeof status === "number") {
        res.status(status);
      }
      return res.json(data);
    },
    text: (data, status) => {
      if (typeof status === "number") {
        res.status(status);
      }
      res.type("text/plain");
      return res.send(data);
    },
    html: (data, status) => {
      if (typeof status === "number") {
        res.status(status);
      }
      res.type("text/html");
      return res.send(data);
    },
    blob: (data, status) => {
      if (typeof status === "number") {
        res.status(status);
      }
      return responseHelpers.send(data);
    },
    stream: (data, status) => {
      if (typeof status === "number") {
        res.status(status);
      }
      return responseHelpers.send(data);
    },
    status: (code) => {
      res.status(code);
      return responseHelpers;
    },
    header: (name, value) => {
      res.setHeader(name, value);
      return responseHelpers;
    },
    redirect: (url, status) => {
      if (typeof status === "number") {
        return res.redirect(status, url);
      }

      return res.redirect(url);
    },
    send: (body, status) => {
      if (typeof status === "number") {
        res.status(status);
      }

      // Always send primitives with Express' native send to preserve types.
      if (
        typeof body === "string" ||
        Buffer.isBuffer(body) ||
        body instanceof ArrayBuffer ||
        ArrayBuffer.isView(body)
      ) {
        return res.send(body);
      }

      // Pipeable responses (streams) are handled by Express directly.
      if (body && typeof (body as any).pipe === "function") {
        return (body as any).pipe(res);
      }

      return res.json(body);
    },
  };

  const getBody = createBodyAccessor(async () => req.body);

  const headers = normalizeHeaders(req.headers ?? {});
  const resolvedRequestId = requestId ?? headers[DEFAULT_REQUEST_ID_HEADER];

  if (resolvedRequestId && !headers[DEFAULT_REQUEST_ID_HEADER]) {
    // Preserve whichever header casing the user expects while still normalizing lookups.
    headers[DEFAULT_REQUEST_ID_HEADER] = resolvedRequestId;
  }

  return {
    framework,
    req: {
      params: normalizeRecord<string>(req.params ?? {}),
      query: normalizeQuery(req.query),
      headers,
      method: req.method,
      path: req.path ?? req.url,
      body: getBody,
    },
    res: responseHelpers,
    next: typeof next === "function" ? async () => next() : async () => undefined,
    get: <T = unknown>(key: string) => store.get(key) as T | undefined,
    set: <T = unknown>(key: string, value: T) => {
      store.set(key, value);
    },
  };
}

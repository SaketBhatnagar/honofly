import { DEFAULT_REQUEST_ID_HEADER } from "../../utils/logger.shared.js";
import { HttpContext, ResponseHelpers } from "../../types/http.types.js";
import { frameworkId } from "./fastify.manifest.js";

type HeaderRecord = Record<string, string | string[] | undefined>;

function normalizeRecord<T>(input: Record<string, T> | undefined | null): Record<string, T> {
  if (!input) {
    return {};
  }

  return Object.entries(input).reduce<Record<string, T>>((acc, [key, value]) => {
    // Align key casing across frameworks to simplify downstream handlers.
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
    // Fastify may expose arrays; flatten to a single string just like Express.
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
      // Parse request.body lazily and reuse the same promise for multiple callers.
      inflight = loader().then((value) => {
        cached = { value };
        return value;
      });
    }

    return inflight;
  };
}

export function buildContext(...params: any[]): HttpContext {
  const [request, reply] = params;
  // Internal storage mirrors Express locals / Hono c.set so helpers stay consistent.
  const store = new Map<string, unknown>();

  const requestLogger = (request as any).log;
  const requestId = (request as any).id;

  if (requestLogger) {
    // Expose the Fastify child logger for framework-neutral middlewares.
    store.set("logger", requestLogger);
  }

  if (requestId) {
    // Make the generated request id available on the normalized context.
    store.set("requestId", requestId);
  }

  const responseHelpers: ResponseHelpers = {
    json: (data, status) => {
      if (typeof status === "number") {
        reply.status(status);
      }
      return reply.send(data);
    },
    text: (data, status) => {
      if (typeof status === "number") {
        reply.status(status);
      }
      reply.type("text/plain");
      return reply.send(data);
    },
    html: (data, status) => {
      if (typeof status === "number") {
        reply.status(status);
      }
      reply.type("text/html");
      return reply.send(data);
    },
    blob: (data, status) => {
      if (typeof status === "number") {
        reply.status(status);
      }
      return responseHelpers.send(data);
    },
    stream: (data, status) => {
      if (typeof status === "number") {
        reply.status(status);
      }
      return responseHelpers.send(data);
    },
    status: (code) => {
      reply.status(code);
      return responseHelpers;
    },
    header: (name, value) => {
      reply.header(name, value);
      return responseHelpers;
    },
    redirect: (url, status) => {
      if (typeof status === "number") {
        return reply.redirect(status, url);
      }

      return reply.redirect(url);
    },
    send: (body, status) => {
      if (typeof status === "number") {
        reply.status(status);
      }

      // Respect Fastify's native handling for primitives and buffers.
      if (
        typeof body === "string" ||
        Buffer.isBuffer(body) ||
        body instanceof ArrayBuffer ||
        ArrayBuffer.isView(body)
      ) {
        return reply.send(body);
      }

      // Fastify can stream directly when given a pipeable value.
      if (body && typeof (body as any).pipe === "function") {
        return reply.send(body);
      }

      return reply.send(body);
    },
  };

  const getBody = createBodyAccessor(async () => request.body);

  const headers = normalizeHeaders(request.headers ?? {});
  const resolvedRequestId = requestId ?? headers[DEFAULT_REQUEST_ID_HEADER];

  if (resolvedRequestId && !headers[DEFAULT_REQUEST_ID_HEADER]) {
    // Ensure lookups via DEFAULT_REQUEST_ID_HEADER succeed regardless of inbound casing.
    headers[DEFAULT_REQUEST_ID_HEADER] = resolvedRequestId;
  }

  return {
    framework: frameworkId,
    req: {
      params: normalizeRecord<string>(request.params ?? {}),
      query: normalizeQuery(request.query),
      headers,
      method: request.method,
      // Fastify exposes multiple path shapes; prefer routerPath then fall back to raw URL.
      path: request.routerPath ?? request.url ?? request.raw?.url ?? "",
      body: getBody,
    },
    res: responseHelpers,
    // Fastify injects next only for compatible plugins; default to a resolved promise.
    next: async () => undefined,
    get: <T = unknown>(key: string) => store.get(key) as T | undefined,
    set: <T = unknown>(key: string, value: T) => {
      store.set(key, value);
    },
  };
}

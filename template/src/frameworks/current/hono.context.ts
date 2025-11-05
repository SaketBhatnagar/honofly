import { DEFAULT_REQUEST_ID_HEADER } from "../../utils/logger.shared.js";
import { HttpContext, ResponseHelpers } from "../../types/http.types.js";
import { frameworkId } from "./hono.manifest.js";

function normalizeRecord<T>(input: Record<string, T> | undefined | null): Record<string, T> {
  if (!input) {
    return {};
  }

  return Object.entries(input).reduce<Record<string, T>>((acc, [key, value]) => {
    // Lower-case keys so route handlers can treat all frameworks uniformly.
    acc[key.toLowerCase()] = value;
    return acc;
  }, {});
}

function normalizeHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    // Headers are case-insensitive; normalize to lowercase for consistent lookups.
    result[key.toLowerCase()] = value;
  });
  return result;
}

function createBodyAccessor<T>(loader: () => Promise<T>): () => Promise<T> {
  let cached: { value: T } | undefined;
  let inflight: Promise<T> | undefined;

  return async () => {
    if (cached) {
      return cached.value;
    }

    if (!inflight) {
      // Parse once and cache so multiple handlers don't re-read the stream.
      inflight = loader().then((value) => {
        cached = { value };
        return value;
      });
    }

    return inflight;
  };
}

// Wrap the Hono context to match the shared HttpContext contract.
export function buildContext(...params: any[]): HttpContext {
  const [c, next] = params;

  const responseHelpers: ResponseHelpers = {
    json: (data, status) => c.json(data as any, status as any),
    text: (data, status) => c.text(data as any, status as any),
    html: (data, status) => c.html(data as any, status as any),
    blob: (data, status) => c.blob(data as any, status as any),
    stream: (data, status) => c.stream(data as any, status as any),
    status: (code) => {
      c.status(code as any);
      return responseHelpers;
    },
    header: (key, value) => {
      c.header(key, value);
      return responseHelpers;
    },
    redirect: (url, status) => c.redirect(url, status as any),
    send: (body, status) => {
      if (
        typeof body === "string" ||
        body instanceof ArrayBuffer ||
        ArrayBuffer.isView(body) ||
        typeof (body as any)?.pipe === "function"
      ) {
        return c.body(body as any, status as any);
      }

      return c.json(body as any, status as any);
    },
  };

  const getBody = createBodyAccessor(async () => c.req.json());

  const headers = normalizeHeaders(c.req.raw.headers);
  const requestId = c.get("requestId") as string | undefined;

  if (requestId && !headers[DEFAULT_REQUEST_ID_HEADER]) {
    // Bubble the request id back through the normalized request shape for middlewares/controllers.
    headers[DEFAULT_REQUEST_ID_HEADER] = requestId;
  }

  return {
    framework: frameworkId,
    req: {
      params: normalizeRecord<string>(c.req.param()),
      query: normalizeRecord<string | string[]>(c.req.query() as Record<string, string | string[]>),
      body: getBody,
      headers,
      method: c.req.method,
      path: c.req.path,
    },
    res: responseHelpers,
    next: typeof next === "function" ? async () => next() : async () => undefined,
    get: c.get.bind(c),
    set: c.set.bind(c),
  };
}

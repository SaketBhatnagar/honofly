import type { Middleware } from "../types/http.types.js";

// Demonstrates how to enrich the context with request-scoped data.
export const captureRequestDetails: Middleware = async (context) => {
  const userAgentHeader = context.req.headers["user-agent"];
  const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader;

  context.set("userAgent", userAgent ?? "unknown");
  context.set("requestStartedAt", Date.now());

  return context.next();
};

// Adds a response-time header to show how middlewares can run work after the handler.
export const applyResponseTiming: Middleware = async (context) => {
  const started = Date.now();

  try {
    return await context.next();
  } finally {
    const fromMiddleware = context.get<number>("requestStartedAt");
    const duration = Date.now() - (typeof fromMiddleware === "number" ? fromMiddleware : started);
    context.res.header("x-response-time", `${duration}ms`);
  }
};

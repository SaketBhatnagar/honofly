import type { Handler, Middleware } from "../types/http.types.js";
import { applyResponseTiming, captureRequestDetails } from "../middlewares/context-example.middleware.js";
import { defineRoutes, route } from "../utils/controller.js";

// Rejects non-JSON payloads to showcase short-circuiting a middleware.
const ensureJsonRequest: Middleware = async (context) => {
  const contentTypeHeader = context.req.headers["content-type"];
  const contentType = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader;

  if (contentType && contentType.includes("application/json")) {
    return context.next();
  }

  return context.res.status(415).json({
    message: "Send JSON when calling this endpoint.",
  });
};

const getWelcome: Handler = async (context) => {
  const requestId = context.get<string>("requestId");

  return context.res.json({
    message: "Honofly is ready to roll",
    framework: context.framework,
    requestId,
  });
};

const getContextSample: Handler = async (context) => {
  const rawName = context.req.query["name"];
  const name = Array.isArray(rawName) ? rawName[0] : rawName;
  const requestId = context.get<string>("requestId");
  const userAgent = context.get<string>("userAgent") ?? "unknown";

  context.res.header("x-demo-context", "true");

  return context.res.json({
    message: `Hello ${name || "from Honofly"}`,
    framework: context.framework,
    requestId,
    userAgent,
  });
};

const postContextSample: Handler = async (context) => {
  const body = await context.req.body<{ greeting?: string; audience?: string }>();
  const greeting = body?.greeting ?? "Hello";
  const audience = body?.audience ?? "friend";

  const response = {
    message: `${greeting}, ${audience}!`,
    receivedAt: new Date().toISOString(),
  };

  return context.res.status(201).json(response);
};

export const exampleRoutes = defineRoutes([
  route({
    method: "GET",
    path: "/",
    middlewares: [captureRequestDetails, applyResponseTiming],
    controller: {
      name: "getWelcome",
      handler: getWelcome,
    },
    docs: {
      tags: ["examples"],
      summary: "Welcome route",
      description: "Returns a simple payload showing that Honofly and HttpContext are wired up.",
      responses: {
        "200": {
          description: "Readiness payload with framework metadata.",
        },
      },
    },
  }),
  route({
    method: "GET",
    path: "/examples/context",
    middlewares: [captureRequestDetails, applyResponseTiming],
    controller: {
      name: "getContextExample",
      handler: getContextSample,
    },
    docs: {
      tags: ["examples"],
      summary: "Inspect normalized HttpContext data",
      description: "Demonstrates how routes can read headers, query params, and context metadata uniformly.",
      parameters: [
        {
          name: "name",
          in: "query",
          required: false,
          description: "Optional name to personalize the greeting.",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Context sample payload containing the normalized request data.",
        },
      },
    },
  }),
  route({
    method: "POST",
    path: "/examples/context",
    middlewares: [ensureJsonRequest, captureRequestDetails, applyResponseTiming],
    controller: {
      name: "createContextExample",
      handler: postContextSample,
    },
    docs: {
      tags: ["examples"],
      summary: "Work with HttpContext.req.body",
      description: "Shows how to parse a JSON body once and send a typed response via the shared helpers.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                greeting: { type: "string", example: "Howdy" },
                audience: { type: "string", example: "team" },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Echoed message built from the request body.",
        },
        "415": {
          description: "Returned when the request is not JSON encoded.",
        },
      },
    },
  }),
]);

import { RouteRegistrar } from "./types";
import { buildControllerHandler, buildMiddlewareChain } from "./shared";

// Minimal shape required from a Hono app instance for dynamic method lookups.
type HonoLikeApp = Record<string, (...args: unknown[]) => unknown>;

const framework = "hono" as const;

export const honoRouteRegistrar: RouteRegistrar = (app, bindings) => {
  const honoApp = app as HonoLikeApp;

  bindings.forEach(({ definition, path }) => {
    const method = definition.method.toLowerCase();
    const register = honoApp[method];

    if (typeof register !== "function") {
      throw new Error(`Hono app does not support method "${definition.method}"`);
    }

    register(
      path,
      ...buildMiddlewareChain(definition.middlewares, framework),
      buildControllerHandler(definition.controller, framework)
    );
  });
};

import { buildControllerHandler, buildMiddlewareChain } from "../../adapters/router/shared.js";
import { RouteRegistrar } from "../../adapters/router/types.js";
import { frameworkId } from "./hono.manifest.js";

// Minimal shape required from a Hono app instance for dynamic method lookups.
type HonoLikeApp = Record<string, (...args: unknown[]) => unknown>;

export const routeRegistrar: RouteRegistrar = (app, bindings) => {
  const honoApp = app as HonoLikeApp;

  bindings.forEach(({ definition, path }) => {
    const method = definition.method.toLowerCase();
    const register = honoApp[method];

    if (typeof register !== "function") {
      throw new Error(`Hono app does not support method "${definition.method}"`);
    }

    register(
      path,
      ...buildMiddlewareChain(definition.middlewares, frameworkId),
      buildControllerHandler(definition.controller, frameworkId),
    );
  });
};

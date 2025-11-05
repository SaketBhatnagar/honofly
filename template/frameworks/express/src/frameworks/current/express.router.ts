import { buildControllerHandler, buildMiddlewareChain } from "../../adapters/router/shared.js";
import { RouteRegistrar } from "../../adapters/router/types.js";
import { frameworkId } from "./express.manifest.js";

type ExpressLikeApp = {
  [method: string]: (...handlers: unknown[]) => unknown;
};

export const routeRegistrar: RouteRegistrar = (app, bindings) => {
  const expressApp = app as ExpressLikeApp;

  bindings.forEach(({ definition, path }) => {
    const method = definition.method.toLowerCase();
    const register = expressApp[method];

    if (typeof register !== "function") {
      throw new Error(`Express app does not support method "${definition.method}"`);
    }

    const middlewares = buildMiddlewareChain(definition.middlewares, frameworkId);
    const controller = buildControllerHandler(definition.controller, frameworkId);

    register.call(expressApp, path, ...middlewares, controller);
  });
};

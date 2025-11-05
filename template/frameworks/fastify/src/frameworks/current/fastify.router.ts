import { buildControllerHandler, buildMiddlewareChain } from "../../adapters/router/shared.js";
import { RouteRegistrar } from "../../adapters/router/types.js";
import { frameworkId } from "./fastify.manifest.js";

type FastifyLikeInstance = {
  route: (config: {
    method: string;
    url: string;
    preHandler?: Array<(...params: unknown[]) => unknown> | ((...params: unknown[]) => unknown);
    handler: (...params: unknown[]) => unknown;
  }) => void;
};

export const routeRegistrar: RouteRegistrar = (app, bindings) => {
  const fastify = app as FastifyLikeInstance;

  bindings.forEach(({ definition, path }) => {
    const preHandlers = buildMiddlewareChain(definition.middlewares, frameworkId);
    const handler = buildControllerHandler(definition.controller, frameworkId);

    fastify.route({
      method: definition.method,
      url: path,
      preHandler: preHandlers.length > 0 ? preHandlers : undefined,
      handler,
    });
  });
};

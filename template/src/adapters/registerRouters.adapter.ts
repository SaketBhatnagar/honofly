import { getHonoFlyContext } from "./hono.adapter";
import { ROUTE } from "../constants/routes-endpoints";
import { Framework, Middleware, HttpContext } from "../types/http.types";

type ContextBuilder = (...params: any[]) => HttpContext;

const contextBuilders: Record<Framework, ContextBuilder> = {
  hono: getHonoFlyContext,
  express: () => {
    throw new Error("Express adapter not implemented yet. Add context builder before registering routes.");
  },
  fastify: () => {
    throw new Error("Fastify adapter not implemented yet. Add context builder before registering routes.");
  },
};

// This is a map of the frameworks and the functions to register the routes for each framework
const frameworkMap: Record<Framework, (app: any, routes: ROUTE[]) => void> = {
  express: () => {
    throw new Error("Express route registrar not implemented yet.");
  },
  hono: (app, routes) => {
    const currentFramework: Framework = "hono";
    routes.forEach((route) => {
      app[route.method.toLowerCase()](
        route.path,
        ...middlewareBuilder(route.middlewares, currentFramework),
        controllerBuilder(route.controller, currentFramework)
      );
    });
  },
  fastify: () => {
    throw new Error("Fastify route registrar not implemented yet.");
  },
};

// This function is used to register the routes for multiple frameworks
export function registerRoutes(app: any, routes: ROUTE[], framework: Framework) {
  frameworkMap[framework](app, routes);
}

// This function is used to build the middleware for the routes and it is used to pass the context specific to the framework to the middleware
function middlewareBuilder(middlewares: Middleware[], framework: Framework) {
  const buildContext = contextBuilders[framework];
  return middlewares.map((middleware) => {
    return async (...params: any[]) => {
      const ctx = buildContext(...params);
      return middleware(ctx);
    };
  });
}

// This function is used to wrap the controller with getHonoFlyContext
function controllerBuilder(controller: ROUTE["controller"], framework: Framework) {
  const buildContext = contextBuilders[framework];
  return async (...params: any[]) => {
    const ctx = buildContext(...params);
    return controller.handler(ctx);
  };
}

  

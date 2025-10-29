import { getContextBuilder } from "./context";
import { ROUTE } from "../constants/routes-endpoints";
import { Framework, Middleware } from "../types/http.types";

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
  // Defer to the registry at runtime so the same route config works everywhere.
  const buildContext = getContextBuilder(framework);
  return middlewares.map((middleware) => {
    return async (...params: any[]) => {
      const ctx = buildContext(...params);
      return middleware(ctx);
    };
  });
}

// This function is used to wrap the controller with the framework-specific context builder
function controllerBuilder(controller: ROUTE["controller"], framework: Framework) {
  // Controllers receive the same HttpContext regardless of underlying server.
  const buildContext = getContextBuilder(framework);
  return async (...params: any[]) => {
    const ctx = buildContext(...params);
    return controller.handler(ctx);
  };
}

  

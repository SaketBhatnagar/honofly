import { getHonoFlyContext } from "./hono.adapter";
import { ROUTE } from "../constants/routes-endpoints";

// This is a map of the frameworks and the functions to register the routes for each framework
const frameworkMap = {
    express: (app: any, routes: ROUTE[]) => routes.forEach(route => {
            app[route.method.toLowerCase()](route.path, ...middlewareBuilder(route.middlewares), controllerBuilder(route.controller));
        })
    ,
    hono: (app: any, routes: ROUTE[]) => routes.forEach(route => {
            app[route.method.toLowerCase()](route.path, ...middlewareBuilder(route.middlewares), controllerBuilder(route.controller));
        })
    ,
    fastify: (app: any, routes: ROUTE[]) => routes.forEach(route => {
            app.route({ method: route.method.toLowerCase(), url: route.path, handler: controllerBuilder(route.controller), preHandler: middlewareBuilder(route.middlewares) });
        })
    
}

// This function is used to register the routes for multiple frameworks
export function registerRoutes(app: any, routes: ROUTE[], framework: "express" | "hono" | "fastify") {
      // This line calls the frameworkMap with framework as the key which generates the routes for the selected framework
      frameworkMap[framework](app, routes);
}  

// This function is used to build the middleware for the routes and it is used to pass the context specific to the framework to the middleware
function middlewareBuilder(middlewares:any) {
    return middlewares.map((middleware:any) => {
        return async(...params:any) => {
            return middleware(getHonoFlyContext(...params));
        }
    });
} 

// This function is used to wrap the controller with getHonoFlyContext
function controllerBuilder({instance, method}: { instance: any; method: string }) {
    return async (...params: any) => {
        return instance[method](getHonoFlyContext(...params));
    };
}

  
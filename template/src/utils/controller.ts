import { Handler } from "../types/http.types";
import { RouteController, ROUTE, ROUTES_ENDPOINTS, RouteDocs } from "../constants/routes-endpoints";

// Helpers that keep controllers declarative and framework-neutral

type MethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

// Bind a concrete method to its instance once and capture a friendly label
export function bindController<T extends object, K extends MethodKeys<T>>(
  instance: T,
  method: K,
  label?: string
): RouteController {
  const candidate = instance[method];

  if (typeof candidate !== "function") {
    throw new Error(`Method "${String(method)}" is not callable on controller instance.`);
  }

  const handler = (candidate as (...args: any[]) => unknown).bind(instance) as Handler;

  return {
    handler,
    name: label ?? `${instance.constructor.name}.${String(method)}`,
  };
}

// Lazily bind controller methods when accessed (keeps route definitions terse)
export function controller<T extends object>(instance: T) {
  const cache = new Map<PropertyKey, RouteController>();
  return new Proxy({} as Record<MethodKeys<T>, RouteController>, {
    get(_, prop: PropertyKey) {
      if (typeof prop !== "string") {
        return undefined;
      }

      if (!cache.has(prop)) {
        cache.set(prop, bindController(instance, prop as MethodKeys<T>));
      }

      return cache.get(prop);
    },
  });
}

type RouteDefinition = ROUTE;

// Explicit helper so IDEs offer key suggestions when defining routes
export function route(definition: RouteDefinition): RouteDefinition {
  return definition;
}

// Hard-coded for now; expand when new HTTP verbs are supported by contracts
const VALID_METHODS: ROUTES_ENDPOINTS[] = ["GET", "POST", "PUT", "DELETE"];

// Validate route definitions once at startup and freeze them for accidental mutations
export function defineRoutes<T extends ROUTE[]>(routes: [...T]): T {
  const seen = new Set<string>();

  routes.forEach((route) => {
    if (!VALID_METHODS.includes(route.method)) {
      throw new Error(`Unsupported method "${route.method}". Allowed: ${VALID_METHODS.join(", ")}.`);
    }

    if (!route.path || !route.path.startsWith("/")) {
      throw new Error(`Route path must start with '/'. Received "${route.path}".`);
    }

    if (!route.controller) {
      throw new Error(`Route ${route.method} ${route.path} is missing a controller.`);
    }

    const key = `${route.method}:${route.path}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate route detected for ${route.method} ${route.path}.`);
    }
    seen.add(key);

    if (!Array.isArray(route.middlewares)) {
      throw new Error(`Route ${route.method} ${route.path} middlewares must be an array.`);
    }

    if (route.docs) {
      freezeDocs(route.docs);
    }
  });

  return Object.freeze(routes) as T;
}

function freezeDocs(docs: RouteDocs) {
  if (docs.parameters) {
    docs.parameters.forEach(Object.freeze);
    Object.freeze(docs.parameters);
  }

  if (docs.requestBody) {
    Object.values(docs.requestBody.content).forEach(Object.freeze);
    Object.freeze(docs.requestBody.content);
    Object.freeze(docs.requestBody);
  }

  if (docs.responses) {
    Object.entries(docs.responses).forEach(([status, response]) => {
      if (response?.content) {
        Object.values(response.content).forEach(Object.freeze);
        Object.freeze(response.content);
      }
      Object.freeze(response);
    });
    Object.freeze(docs.responses);
  }

  if (docs.security) {
    docs.security.forEach(Object.freeze);
    Object.freeze(docs.security);
  }

  if (docs.tags) {
    Object.freeze(docs.tags);
  }

  Object.freeze(docs);
}

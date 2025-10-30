import { ROUTE } from "../constants/routes-endpoints";
import { Framework } from "../types/http.types";
import { getRouteRegistrar, RouteBinding } from "./router";

export type RouteGroupInput = string | string[];

export type RouteRegistrationOptions = {
  /**
   * Optional prefix (single string or array of segments) applied before registering routes.
   * Examples:
   *   "/api/v1" -> "/api/v1/users"
   *   ["/api", "v1"] -> "/api/v1/users"
   */
  prefix?: RouteGroupInput;
};

export function registerRoutes(
  app: unknown,
  routes: readonly ROUTE[],
  framework: Framework,
  options?: RouteRegistrationOptions
) {
  // Resolve the framework-specific registrar once so adapters stay decoupled.
  const registrar = getRouteRegistrar(framework);
  // Normalize and decorate the static config before handing it to the underlying server.
  const bindings = buildRouteBindings(routes, framework, options);
  registrar(app, bindings);
}

function buildRouteBindings(
  routes: readonly ROUTE[],
  framework: Framework,
  options?: RouteRegistrationOptions
): RouteBinding[] {
  const prefixSegments = normalizePrefix(options?.prefix);

  return routes.map((definition) => {
    const withPrefix = applyPrefix(definition.path, prefixSegments);
    const normalized = normalizePathForFramework(withPrefix, framework);

    return {
      definition,
      path: normalized,
    };
  });
}

function normalizePrefix(prefix?: RouteGroupInput): string[] {
  if (!prefix) {
    return [];
  }

  // Support both "/api/v1" and ["/api", "v1"], trimming excess slashes and blanks.
  const segments = Array.isArray(prefix) ? prefix : [prefix];

  return segments
    .flatMap((segment) => segment.split("/"))
    .map((segment) => segment.trim())
    .map(trimSlashes)
    .filter(Boolean);
}

function applyPrefix(path: string, prefixSegments: string[]): string {
  const normalizedPath = normalizeBasePath(path);

  if (prefixSegments.length === 0) {
    return normalizedPath;
  }

  // Glue the prefix back together with leading slash to keep router APIs happy.
  const prefix = `/${prefixSegments.join("/")}`;

  if (normalizedPath === "/") {
    return prefix;
  }

  return `${prefix}${normalizedPath}`;
}

function normalizePathForFramework(path: string, framework: Framework): string {
  const normalized = normalizeDynamicSegments(path);

  switch (framework) {
    case "express":
    case "hono":
    case "fastify":
      return normalized;
    default:
      return normalized;
  }
}

function normalizeDynamicSegments(path: string): string {
  // Convert OpenAPI-style "{id}" parameters to ":id" so Express/Hono/Fastify share syntax.
  return path.replace(/\{(\w+)\}/g, ":$1");
}

function normalizeBasePath(path: string): string {
  const sanitized = path.trim() || "/";
  const withLeadingSlash = sanitized.startsWith("/") ? sanitized : `/${sanitized}`;
  const dedupedSlashes = withLeadingSlash.replace(/\/{2,}/g, "/");

  if (dedupedSlashes.length > 1 && dedupedSlashes.endsWith("/")) {
    return dedupedSlashes.slice(0, -1);
  }

  return dedupedSlashes || "/";
}

function trimSlashes(segment: string): string {
  return segment.replace(/^\/+/, "").replace(/\/+$/, "");
}

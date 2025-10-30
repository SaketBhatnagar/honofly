import { Framework } from "../../types/http.types";
import { expressRouteRegistrar } from "./express";
import { fastifyRouteRegistrar } from "./fastify";
import { honoRouteRegistrar } from "./hono";
import { RouteRegistrar } from "./types";

// Keep new framework adapters discoverable via a single registry.
const registry: Partial<Record<Framework, RouteRegistrar>> = {
  express: expressRouteRegistrar,
  fastify: fastifyRouteRegistrar,
  hono: honoRouteRegistrar,
};

export function getRouteRegistrar(framework: Framework): RouteRegistrar {
  const registrar = registry[framework];

  if (!registrar) {
    throw new Error(
      `Route registrar not found for framework: ${String(framework)}. Allowed: ${Object.keys(registry).join(
        " | "
      )}.`
    );
  }

  return registrar;
}

export type { RouteBinding, RouteRegistrar } from "./types";

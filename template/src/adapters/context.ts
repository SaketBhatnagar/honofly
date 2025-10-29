import { Framework, HttpContext } from "../types/http.types";
import { buildHonoContext } from "./context.hono";
import { buildExpressContext } from "./context.express";
import { buildFastifyContext } from "./context.fastify";

export type ContextBuilder = (...params: any[]) => HttpContext;

// Registry keeps framework bindings in one place so other modules stay agnostic.
const contextBuilders: Record<Framework, ContextBuilder> = {
  hono: buildHonoContext,
  express: buildExpressContext,
  fastify: buildFastifyContext,
};

export function getContextBuilder(framework: Framework): ContextBuilder {
  const builder = contextBuilders[framework];

  if (!builder) {
    throw new Error(
      `Context builder not found for framework: ${String(framework)}. Allowed: ${Object.keys(contextBuilders).join(
        " | "
      )}.`
    );
  }

  return builder;
}

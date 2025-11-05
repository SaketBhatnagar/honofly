import { getContextBuilder } from "../context.js";
import { Framework, Middleware } from "../../types/http.types.js";
import { ROUTE } from "../../constants/routes-endpoints.js";
import { composeMiddlewares } from "../../middlewares/composer.js";

// Wrap middlewares so each receives a normalized HttpContext for the active framework.
export function buildMiddlewareChain(middlewares: Middleware[], framework: Framework) {
  const buildContext = getContextBuilder(framework);
  if (middlewares.length === 0) {
    return [];
  }

  // Collapse the registered middlewares into a single callable so adapters only register one handler.
  const composed = composeMiddlewares(middlewares);

  return [
    async (...params: unknown[]) => {
      const ctx = buildContext(...params);
      return composed(ctx);
    },
  ];
}

// Same idea for controllers—ensure handlers stay framework-neutral.
export function buildControllerHandler(controller: ROUTE["controller"], framework: Framework) {
  const buildContext = getContextBuilder(framework);
  return async (...params: unknown[]) => {
    const ctx = buildContext(...params);
    return controller.handler(ctx);
  };
}

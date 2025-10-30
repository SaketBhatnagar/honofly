import { getContextBuilder } from "../context";
import { Framework, Middleware } from "../../types/http.types";
import { ROUTE } from "../../constants/routes-endpoints";

// Wrap middlewares so each receives a normalized HttpContext for the active framework.
export function buildMiddlewareChain(middlewares: Middleware[], framework: Framework) {
  const buildContext = getContextBuilder(framework);
  return middlewares.map((middleware) => {
    return async (...params: unknown[]) => {
      const ctx = buildContext(...params);
      return middleware(ctx);
    };
  });
}

// Same idea for controllers—ensure handlers stay framework-neutral.
export function buildControllerHandler(controller: ROUTE["controller"], framework: Framework) {
  const buildContext = getContextBuilder(framework);
  return async (...params: unknown[]) => {
    const ctx = buildContext(...params);
    return controller.handler(ctx);
  };
}

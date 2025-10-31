import { HttpContext, Middleware, ResponseHelpers } from "../types/http.types";

// Utility that turns an array of HttpContext-aware middlewares into a single callable while
// keeping framework-specific response helpers under observation so we can short-circuit once sent.

type ResponseTracker = {
  res: ResponseHelpers;
  isSent: () => boolean;
  result: () => unknown;
};

const TERMINATING_METHODS = ["json", "text", "html", "blob", "stream", "redirect", "send"] as const;

const CHAINABLE_METHODS = ["status", "header"] as const;

function trackResponse(res: ResponseHelpers): ResponseTracker {
  let sent = false;
  let lastResult: unknown;

  const markSent = () => {
    sent = true;
  };

  const overrides: Partial<Record<keyof ResponseHelpers, (...args: any[]) => any>> = {};
  let proxied: ResponseHelpers;

  TERMINATING_METHODS.forEach((method) => {
    const original = res[method];

    if (typeof original !== "function") {
      return;
    }

    overrides[method] = ((...args: any[]) => {
      markSent();
      lastResult = (original as (...args: any[]) => unknown).apply(res, args);
      return lastResult;
    }) as any;
  });

  CHAINABLE_METHODS.forEach((method) => {
    const original = res[method];

    if (typeof original !== "function") {
      return;
    }

    overrides[method] = ((...args: any[]) => {
      const chain = (original as (...args: any[]) => ResponseHelpers).apply(res, args);
      return proxied ?? chain;
    }) as any;
  });

  proxied = {
    ...res,
    ...(overrides as Partial<ResponseHelpers>),
  };

  return {
    res: proxied,
    isSent: () => sent,
    result: () => lastResult,
  };
}

export function composeMiddlewares(middlewares: readonly Middleware[]): Middleware {
  const stack = [...middlewares];

  return async function composed(context: HttpContext) {
    if (stack.length === 0) {
      return context.next();
    }

    const originalNext = context.next;
    // Swap response helpers with tracked versions so any terminal call marks the chain as complete.
    const tracker = trackResponse(context.res);

    const proxiedContext: HttpContext = {
      ...context,
      res: tracker.res,
      // Preserve original next() so adapters that expect it still behave as before.
      next: async () => originalNext(),
    };

    let index = -1;

    // Recursive walker that mimics Express-style middleware traversal while respecting sent responses.
    const dispatch = async (i: number): Promise<unknown> => {
      if (tracker.isSent()) {
        return;
      }

      if (i <= index) {
        throw new Error("next() called multiple times in middleware chain.");
      }

      index = i;

      if (i === stack.length) {
        proxiedContext.next = originalNext;
        if (tracker.isSent()) {
          return tracker.result();
        }
        return originalNext();
      }

      const middleware = stack[i];
      const previousNext = proxiedContext.next;

      proxiedContext.next = async () => {
        if (tracker.isSent()) {
          return tracker.result();
        }

        return dispatch(i + 1);
      };

      try {
        return await middleware(proxiedContext);
      } finally {
        proxiedContext.next = previousNext;
      }
    };

    const result = await dispatch(0);
    return tracker.isSent() ? tracker.result() ?? result : result;
  };
}

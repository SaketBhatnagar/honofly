import { jwtVerify } from "jose";
import { env } from "../config/env";
import { Middleware } from "../types/http.types";

const BEARER_PREFIX = "bearer ";

// Framework-neutral JWT guard that enforces Bearer auth and stores the verified payload on the context.
export const authMiddleware: Middleware = async ({ req, res, set, next }) => {
  const authorization = req.headers["authorization"];

  if (!authorization || !authorization.toLowerCase().startsWith(BEARER_PREFIX)) {
    return res.json(
      {
        error: "unauthorized",
        message: "Bearer token required in Authorization header.",
      },
      401
    );
  }

  const token = authorization.slice(BEARER_PREFIX.length).trim();

  if (!token) {
    return res.json(
      {
        error: "unauthorized",
        message: "Bearer token required in Authorization header.",
      },
      401
    );
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    set("user", payload);
    return next();
  } catch {
    return res.json(
      {
        error: "forbidden",
        message: "Invalid or expired token.",
      },
      403
    );
  }
};

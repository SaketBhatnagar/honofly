import { z } from "zod";
import { Framework } from "../types/http.types.js";

const isNodeRuntime =
  typeof globalThis.process !== "undefined" && globalThis.process?.release?.name === "node";

const FrameworkSchema = z.enum(["hono", "express", "fastify"]);

const RawEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/postgres"),
  JWT_SECRET: z.string().default("secret"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  JWT_ALGORITHM: z.string().default("HS256"),
  JWT_ISSUER: z.string().default("auth"),
  JWT_AUDIENCE: z.string().default("api"),
  FRAMEWORK: FrameworkSchema.default("hono"),
  ROUTE_PREFIX: z.string().optional(),
});

type RawEnv = z.infer<typeof RawEnvSchema>;

interface Env {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_ALGORITHM: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  framework: Framework;
  routePrefix?: string | string[];
}

const parseRoutePrefix = (value?: RawEnv["ROUTE_PREFIX"]): Env["routePrefix"] => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const segments = normalized.split(",").map((segment) => segment.trim()).filter(Boolean);
  if (segments.length <= 1) {
    return segments[0] ?? normalized;
  }

  return segments;
};

// Use injected environment variables when available; Workers inject them at build/runtime.
const sourceEnv = isNodeRuntime ? globalThis.process.env ?? {} : {};
const rawEnv = RawEnvSchema.parse(sourceEnv);

const env: Env = {
  PORT: rawEnv.PORT,
  DATABASE_URL: rawEnv.DATABASE_URL,
  JWT_SECRET: rawEnv.JWT_SECRET,
  JWT_EXPIRES_IN: rawEnv.JWT_EXPIRES_IN,
  JWT_ALGORITHM: rawEnv.JWT_ALGORITHM,
  JWT_ISSUER: rawEnv.JWT_ISSUER,
  JWT_AUDIENCE: rawEnv.JWT_AUDIENCE,
  framework: rawEnv.FRAMEWORK,
  routePrefix: parseRoutePrefix(rawEnv.ROUTE_PREFIX),
};

export default env;
export { env };

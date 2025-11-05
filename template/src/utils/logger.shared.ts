import pino, { type Logger as PinoLogger, type LoggerOptions as PinoLoggerOptions } from "pino";
import type { Framework } from "../types/http.types.js";

export type LoggerOptions = {
  level?: PinoLoggerOptions["level"];
  requestIdHeader?: string;
  base?: Record<string, unknown>;
  /**
   * Pass-through configuration for the underlying Pino instance.
   * Values here override the defaults we establish per framework.
   */
  pino?: Omit<PinoLoggerOptions, "level" | "base"> & { base?: PinoLoggerOptions["base"] };
};

export const DEFAULT_REQUEST_ID_HEADER = "x-request-id";

export function normalizeHeaderName(name: string): string {
  return name.trim().toLowerCase();
}

type CryptoLike = {
  randomUUID?: () => string;
};

function getGlobalCrypto(): CryptoLike | undefined {
  // Workers runtime exposes crypto at globalThis.crypto, but guard for Node and tests where it may be undefined.
  return (globalThis as typeof globalThis & { crypto?: CryptoLike }).crypto;
}

export function generateRequestId(): string {
  const globalCrypto = getGlobalCrypto();

  if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
    return globalCrypto.randomUUID();
  }

  const random = Math.random().toString(16).slice(2);
  return `${Date.now().toString(16)}-${random}`;
}

export function ensureRequestId(value?: string | string[]): string {
  const normalized = Array.isArray(value) ? value.find(Boolean) : value;
  const trimmed = normalized?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : generateRequestId();
}

export function statusToLevel(status: number): "info" | "warn" | "error" {
  if (status >= 500) {
    return "error";
  }

  if (status >= 400) {
    return "warn";
  }

  return "info";
}

export function createPinoConfig(framework: Framework, options?: LoggerOptions): PinoLoggerOptions {
  const { level = "info", base = {}, pino: overrides } = options ?? {};
  const mergedBase = { framework, ...base, ...(overrides?.base ?? {}) };

  return {
    level,
    ...overrides,
    base: mergedBase,
  } satisfies PinoLoggerOptions;
}

export function createPinoInstance(framework: Framework, options?: LoggerOptions): PinoLogger {
  // Centralized factory so every framework logger shares the same baseline configuration.
  return pino(createPinoConfig(framework, options));
}

export type { PinoLogger, PinoLoggerOptions };

import type { Framework } from "../types/http.types.js";
import { displayName, frameworkId } from "../frameworks/current/manifest.js";
import { createLogger as createFrameworkLogger, type FrameworkLogger } from "../frameworks/current/logger.js";
import type { LoggerOptions } from "./logger.shared.js";

export type LoggerForFramework<F extends Framework> = F extends typeof frameworkId ? FrameworkLogger : never;

export async function getLogger<F extends Framework>(
  framework: F,
  options?: LoggerOptions,
): Promise<LoggerForFramework<F>> {
  if (framework !== frameworkId) {
    throw new Error(
      `Framework "${String(
        framework,
      )}" is not available in this scaffold. Re-run the generator with "--framework ${frameworkId}" or install the ${displayName} variant.`,
    );
  }

  return createFrameworkLogger(options) as LoggerForFramework<F>;
}

export type { FrameworkLogger };
export type { LoggerOptions } from "./logger.shared.js";
export {
  DEFAULT_REQUEST_ID_HEADER,
  ensureRequestId,
  normalizeHeaderName,
  createPinoConfig,
  createPinoInstance,
  statusToLevel,
} from "./logger.shared.js";

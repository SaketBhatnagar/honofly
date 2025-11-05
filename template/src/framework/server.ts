import { env } from "../config/env.js";
import { frameworkId, displayName } from "../frameworks/current/manifest.js";
import { createApp } from "../frameworks/current/server.js";
import type { Framework } from "../types/http.types.js";

interface CreateServerOptions {
  logger?: Parameters<typeof createApp>[0];
}

export function createServer(framework?: Framework, options: CreateServerOptions = {}) {
  const configuredFramework = env.framework;
  if (configuredFramework !== frameworkId) {
    throw new Error(
      [
        `[honofly] Detected FRAMEWORK="${configuredFramework}" but this scaffold is locked to "${frameworkId}".`,
        `Update your environment to FRAMEWORK="${frameworkId}" or re-run "npm create honofly@latest -- --framework ${configuredFramework}" to regenerate the ${configuredFramework} variant.`,
      ].join(" "),
    );
  }

  const target: Framework = framework ?? configuredFramework;

  if (target !== frameworkId) {
    throw new Error(
      [
        `Framework "${String(target)}" is not available in this scaffold (active: ${displayName}).`,
        `Re-run "npm create honofly@latest -- --framework ${String(target)}" to scaffold the ${String(target)} runtime.`,
      ].join(" "),
    );
  }

  const { logger } = options as { logger?: Parameters<typeof createApp>[0] };

  if (typeof logger !== "undefined") {
    return createApp(logger);
  }

  return createApp();
}

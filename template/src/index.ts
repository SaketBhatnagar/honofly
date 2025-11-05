import { createServer } from "./framework/server.js";
import { env } from "./config/env.js";
import { displayName, frameworkId, runtime } from "./frameworks/current/manifest.js";
import { getLogger } from "./utils/logger.js";

const framework = env.framework;

if (framework !== frameworkId) {
  throw new Error(
    [
      `[honofly] Detected FRAMEWORK="${framework}" but this scaffold is locked to "${frameworkId}".`,
      `Update your environment to FRAMEWORK="${frameworkId}" or re-run "npm create honofly@latest -- --framework ${framework}" to regenerate a compatible project.`,
    ].join(" "),
  );
}

const logger = await getLogger(frameworkId);
const app = createServer(frameworkId, { logger });
const activeFramework = frameworkId as string;
const activeRuntime = runtime as string;

async function startServer() {
  if (activeRuntime !== "node") {
    throw new Error(
      `${displayName} targets the Workers runtime. Use "wrangler dev" instead of invoking startServer() directly.`,
    );
  }

  const port = env.PORT;

  if (activeFramework === "express") {
    await new Promise<void>((resolve) => {
      (app as any).listen(port, () => {
        console.log(`[express] listening on http://localhost:${port}`);
        resolve();
      });
    });
    return;
  }

  if (activeFramework === "fastify") {
    await (app as any).listen({ port, host: "0.0.0.0" });
    console.log(`[fastify] listening on http://localhost:${port}`);
  }
}

const isMainModule = await (async () => {
  if (typeof process === "undefined" || !Array.isArray(process.argv) || !process.argv[1]) {
    return false;
  }

  try {
    const [pathModule, urlModule] = await Promise.all([import("node:path"), import("node:url")]);
    const currentPath = urlModule.fileURLToPath(import.meta.url);
    const invokedPath = pathModule.resolve(process.argv[1]);
    return currentPath === invokedPath;
  } catch {
    return false;
  }
})();

if (isMainModule) {
  startServer().catch((error) => {
    console.error(`Failed to start ${activeFramework} server`, error);
    process.exitCode = 1;
  });
}

export { startServer };
export default app;

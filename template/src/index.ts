import { createServer } from "./framework/server";
import { env } from "./config/env";
import { getLogger } from "./utils/logger";

const framework = env.framework;
// Resolve the framework-specific logger before creating the server instance.
const logger = await getLogger(framework);
const app = createServer(framework, { logger });

app.get("/", (c) => c.json({message: "Hello World"}));

export default app;

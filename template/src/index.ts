import { createServer } from "./framework/server";
import { pinoLogger } from "./utils/logger";
import { env } from "./config/env";

const app = createServer(env.framework);

app.use('*', pinoLogger());

app.get("/", (c) => c.json({message: "Hello World"}));

export default app;

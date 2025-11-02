import { createServer } from "./framework/server";
import { env } from "./config/env";

const app = createServer(env.framework);

app.get("/", (c) => c.json({message: "Hello World"}));

export default app;

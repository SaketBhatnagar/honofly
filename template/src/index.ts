import {env} from "./config/env";
import {createHonoApp} from "./framework/hono.server";
import { pinoLogger } from "./utils/logger";



const app = createHonoApp();

app.use('*', pinoLogger());

app.get("/", (c) => c.json({message: "Hello World"}));


export default app;
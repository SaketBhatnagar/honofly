import { pinoLogger as logger} from "hono-pino";

export function pinoLogger(){
    return logger({pino: {level: "info",timestamp: true,fatal: () => { console.log("fatal")}}, http: {reqId: () => crypto.randomUUID()}});
}
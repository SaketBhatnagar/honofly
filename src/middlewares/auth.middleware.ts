import { env } from "../config/env";

import { jwtVerify } from "jose";

// Hono Version
export async function honoAuthMiddleware(...params:any) {
  const {req,res,next,set} = params[0];
  console.log("auth middleware");
    // try {
    //   const token = req.header("authorization")?.split(" ")[1];
    //   if (!token) {
    //     return res.json({ error: "Unauthorized: No token provided" }, 401);
    //   }
    //   const secret = new TextEncoder().encode(env.JWT_SECRET);
    //   const { payload } = await jwtVerify(token, secret);
    //   set("user", payload);
    //   await next();
    // } catch (error) {
    //   return res.json({ error: "Forbidden: Invalid token" }, 403);
    // }
    await next();
  }
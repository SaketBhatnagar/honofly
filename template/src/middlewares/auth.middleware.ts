import { Middleware } from "../types/http.types";

// Hono Version
export const honoAuthMiddleware: Middleware = async (context) => {
  const { next } = context;
  console.log("auth middleware");
  // const { req, res, set } = context;
  // try {
  //   const token = req.headers["authorization"]?.split(" ")[1];
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
};

import { exampleRoutes } from "./routes/example.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";

export const allRoutes = [...exampleRoutes, ...userRoutes];
export { createDocsRoutes } from "./helpers/docs.routes.js";

import { ROUTE } from "../../constants/routes-endpoints";

// Flattened route definition plus computed path specific to the runtime adapter.
export type RouteBinding = {
  definition: ROUTE;
  path: string;
};

export type RouteRegistrar = (app: unknown, routes: RouteBinding[]) => void;

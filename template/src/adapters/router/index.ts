import { frameworkId, displayName } from "../../frameworks/current/manifest.js";
import { routeRegistrar } from "../../frameworks/current/router.js";
import { Framework } from "../../types/http.types.js";
import { RouteRegistrar } from "./types.js";

export function getRouteRegistrar(framework: Framework): RouteRegistrar {
  if (framework !== frameworkId) {
    throw new Error(
      `Route registrar not available for framework "${String(
        framework,
      )}". Re-run the generator with "--framework ${frameworkId}" to scaffold the ${displayName} bindings.`,
    );
  }

  return routeRegistrar;
}

export type { RouteBinding, RouteRegistrar } from "./types.js";

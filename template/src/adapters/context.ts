import { frameworkId, displayName } from "../frameworks/current/manifest.js";
import { buildContext } from "../frameworks/current/context.js";
import { Framework, HttpContext } from "../types/http.types.js";

export type ContextBuilder = (...params: any[]) => HttpContext;

export function getContextBuilder(framework: Framework): ContextBuilder {
  if (framework !== frameworkId) {
    throw new Error(
      `Context builder not available for framework "${String(
        framework,
      )}". Re-run the generator with "--framework ${frameworkId}" to scaffold the ${displayName} bindings.`,
    );
  }

  return buildContext;
}

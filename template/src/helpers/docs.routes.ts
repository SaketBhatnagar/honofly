import type { ROUTE } from "../constants/routes-endpoints";
import { docsConfig, type DocsConfig, type ReferenceUiVariant } from "../config/docs";
import { openAPIConfig } from "../config/openapi";
import type { HttpRequest } from "../types/http.types";

type DocsRouteOptions = Partial<Pick<DocsConfig, "docPath" | "referencePath">> & {
  referenceUi?: ReferenceUiVariant;
  basePath?: string | string[];
};

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Map configuration values to concrete path strings so the docs loader stays framework-agnostic.
function normalizeBasePath(basePath?: string | string[]): string | undefined {
  if (!basePath) {
    return undefined;
  }

  const segments = (Array.isArray(basePath) ? basePath : [basePath])
    .flatMap((segment) => segment.split("/"))
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  const joined = `/${segments.join("/")}`;
  return joined.replace(/\/{2,}/g, "/");
}

function resolveOrigin(req: HttpRequest): string {
  const forwardedProto = (req.headers["x-forwarded-proto"] ?? req.headers["x-forwarded-protocol"]) as string | undefined;
  const protoHeader = forwardedProto?.split(",")[0]?.trim();
  const protocol = protoHeader || (req.headers["cf-visitor"] ? "https" : "http");
  const host = (req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "").split(",")[0]?.trim();

  if (host) {
    return `${protocol}://${host}`;
  }

  // Fallback for environments without host header (unlikely but safe guard).
  return `${protocol}://localhost`;
}

// Produce a request-scoped document so the rendered spec reflects the active deployment URL.
function buildOpenApiDocument(req: HttpRequest, basePath?: string) {
  const origin = resolveOrigin(req);
  const normalizedBase = basePath && basePath !== "/" ? basePath : "";
  const serverUrl = `${origin}${normalizedBase}`;

  return {
    ...openAPIConfig,
    servers: [
      {
        url: serverUrl,
      },
    ],
  };
}

// Reuse vendor-hosted bundles so we don't couple to framework-specific plugins.
function buildSwaggerReferenceHtml(docPath: string): string {
  const docUrl = JSON.stringify(docPath);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Reference</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: ${docUrl},
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout'
        });
      };
    </script>
  </body>
</html>`;
}

// Scalar embed stays CDN-backed so users get the latest UI without shipping extra assets.
function buildScalarReferenceHtml(docPath: string): string {
  const docAttr = escapeAttribute(docPath);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Reference</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="${docAttr}"
      data-theme="kepler"
      data-layout="classic"
      data-hide-client-button="true"
      data-default-http-client='{"targetKey":"javascript","clientKey":"fetch"}'
      src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"
    ></script>
  </body>
</html>`;
}

function getReferenceHtml(variant: ReferenceUiVariant, docPath: string): string {
  return variant === "swagger" ? buildSwaggerReferenceHtml(docPath) : buildScalarReferenceHtml(docPath);
}

export function createDocsRoutes(options?: DocsRouteOptions): readonly ROUTE[] {
  const docPath = options?.docPath ?? docsConfig.docPath;
  const referencePath = options?.referencePath ?? docsConfig.referencePath;
  const referenceUi = options?.referenceUi ?? docsConfig.referenceUi;
  const basePath = normalizeBasePath(options?.basePath);

  return [
    // Serve the OpenAPI JSON in a deterministic shape so external tools can always introspect routes.
    Object.freeze({
      method: "GET",
      path: docPath,
      middlewares: [],
      controller: {
        name: "getOpenApiDocument",
        handler: async ({ req, res }) => res.json(buildOpenApiDocument(req, basePath)),
      },
    }),
    // Serve a lightweight HTML shell that embeds the selected reference UI via CDN.
    Object.freeze({
      method: "GET",
      path: referencePath,
      middlewares: [],
      controller: {
        name: "getApiReferenceUi",
        handler: async ({ res }) => res.html(getReferenceHtml(referenceUi, docPath)),
      },
    }),
  ] as const;
}

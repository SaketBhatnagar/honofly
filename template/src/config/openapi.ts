import { allDocs } from "../all.docs.js";

// Keep the base document immutable so downstream code can safely reuse it across requests.
export const openAPIConfig = Object.freeze({
  openapi: "3.0.0",
  info: Object.freeze({
    title: "User Management API",
    version: "1.0.0",
    description: "Auto-generated OpenAPI docs",
  }),
  paths: Object.freeze({
    ...allDocs,
  }),
});

export type OpenAPIConfig = typeof openAPIConfig;

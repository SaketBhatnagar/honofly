import { Handler, Middleware } from '../types/http.types';

export type ROUTES_ENDPOINTS = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type RouteController = {
  handler: Handler;
  name?: string;
};

export type RouteParameterLocation = 'path' | 'query' | 'header' | 'cookie';

export type RouteParameterSpec = {
  name: string;
  in: RouteParameterLocation;
  required?: boolean;
  description?: string;
  schema: unknown;
};

export type RouteMediaTypeObject = {
  schema?: unknown;
  example?: unknown;
  examples?: Record<string, unknown>;
};

export type RouteResponseSpec = {
  description?: string;
  headers?: Record<string, unknown>;
  content?: Record<string, RouteMediaTypeObject>;
};

export type RouteRequestBodySpec = {
  description?: string;
  required?: boolean;
  content: Record<string, RouteMediaTypeObject>;
};

export type RouteDocs = {
  summary?: string;
  description?: string;
  tags?: string[];
  security?: Array<Record<string, unknown>>;
  parameters?: RouteParameterSpec[];
  requestBody?: RouteRequestBodySpec;
  responses?: Record<string, RouteResponseSpec>;
};

export type ROUTE = {
  method: ROUTES_ENDPOINTS;
  path: string;
  middlewares: Middleware[];
  controller: RouteController;
  docs?: RouteDocs;
};

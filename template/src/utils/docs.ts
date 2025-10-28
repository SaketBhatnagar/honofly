import type { ROUTE, ROUTES_ENDPOINTS, RouteDocs } from "../constants/routes-endpoints";

type VerbDocsMap = Partial<Record<Lowercase<ROUTES_ENDPOINTS>, RouteDocs>>;

export type RouteDocsRecord = Readonly<Record<string, Readonly<VerbDocsMap>>>;

export function buildDocsFromRoutes(routes: readonly ROUTE[]): RouteDocsRecord {
  const result: Record<string, VerbDocsMap> = {};

  routes.forEach((route) => {
    const method = route.method.toLowerCase() as Lowercase<ROUTES_ENDPOINTS>;
    const entry = result[route.path] ?? (result[route.path] = {} as VerbDocsMap);
    entry[method] = route.docs ?? {
      summary: route.controller.name ?? `${route.method} ${route.path}`,
    };
  });

  Object.entries(result).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([verb, spec]) => {
      if (spec) {
        methods[verb as Lowercase<ROUTES_ENDPOINTS>] = Object.freeze(spec);
      }
    });
    result[path] = Object.freeze({ ...methods });
  });

  return Object.freeze(result) as RouteDocsRecord;
}

export function mergeDocsRecords(...records: RouteDocsRecord[]): RouteDocsRecord {
  const merged: Record<string, VerbDocsMap> = {};

  records.forEach((record) => {
    Object.entries(record).forEach(([path, methods]) => {
      const target = merged[path] ?? (merged[path] = {} as VerbDocsMap);
      Object.entries(methods).forEach(([verb, spec]) => {
        target[verb as Lowercase<ROUTES_ENDPOINTS>] = spec;
      });
    });
  });

  Object.entries(merged).forEach(([path, methods]) => {
    merged[path] = Object.freeze({ ...methods });
  });

  return Object.freeze({ ...merged }) as RouteDocsRecord;
}

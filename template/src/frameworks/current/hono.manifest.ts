export const frameworkId = "hono" as const;
export const displayName = "Hono" as const;
export const runtime = "workers" as const;

export type ActiveFramework = typeof frameworkId;

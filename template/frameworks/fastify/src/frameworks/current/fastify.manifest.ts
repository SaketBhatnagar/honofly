export const frameworkId = "fastify" as const;
export const displayName = "Fastify" as const;
export const runtime = "node" as const;

export type ActiveFramework = typeof frameworkId;

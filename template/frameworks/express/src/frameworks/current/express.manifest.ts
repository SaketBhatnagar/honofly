export const frameworkId = "express" as const;
export const displayName = "Express" as const;
export const runtime = "node" as const;

export type ActiveFramework = typeof frameworkId;

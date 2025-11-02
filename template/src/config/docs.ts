export type ReferenceUiVariant = "scalar" | "swagger";

export type DocsConfig = Readonly<{
  docPath: string;
  referencePath: string;
  referenceUi: ReferenceUiVariant;
}>;

export const docsConfig: DocsConfig = Object.freeze({
  docPath: "/doc",
  referencePath: "/reference",
  referenceUi: "scalar",
} as const);

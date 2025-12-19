// Re-export all types for convenience
export type { ErrorProcessorConfig } from "./errorProcessor";

export type { ErrorNarratorFilters, ErrorNarratorConfig } from "./config";

export type { ErrorNarratorStatus, ErrorNarratorOptions } from "./browser";

// Additional type definitions
export type ErrorSeverity = "critical" | "warning" | "normal";

export interface SyntheticError extends Error {
  message: string;
  name: string;
  constructor: { name: string };
  toString: () => string;
}

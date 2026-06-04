export type AppMode =
  | "setup"
  | "profile-select"
  | "profile-form"
  | "connecting"
  | "editor"
  | "loading"
  | "results"
  | "error";

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  duration: number;
  rowCount: number;
  sql: string;
}

export type OutputFormat = "table" | "csv" | "json" | "markdown";

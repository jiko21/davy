// アプリ全体のモード（プロファイル選択など）
export type AppMode =
  | "setup"
  | "profile-select"
  | "profile-form"
  | "connecting"
  | "main";

// タブごとのモード
export type TabMode = "editor" | "loading" | "results" | "error" | "profile-select";

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  duration: number;
  rowCount: number;
  sql: string;
}

export interface Tab {
  id: number;
  sql: string;
  result: QueryResult | null;
  mode: TabMode;
  error: Error | null;
  focus: "editor" | "result";
  profileName: string;
}

export type OutputFormat = "table" | "csv" | "json" | "markdown";

export function newTab(id: number, profileName: string): Tab {
  return { id, sql: "", result: null, mode: "editor", error: null, focus: "editor", profileName };
}

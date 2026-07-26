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

// タブのプロファイルを切り替える際に適用する更新分。プロファイルが変わる場合は
// 前の接続で取得した結果・エラーを破棄する（別プロファイルの名義で表示・
// コピーされるのを防ぐため）。同じプロファイルを選び直した場合は何も破棄しない。
export function tabProfileSwitchPatch(previousProfileName: string, newProfileName: string): Partial<Tab> {
  if (newProfileName === previousProfileName) {
    return { profileName: newProfileName, mode: "editor" };
  }
  return { profileName: newProfileName, mode: "editor", result: null, error: null, focus: "editor" };
}

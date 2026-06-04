import { KEYWORDS } from "./syntax-highlight";
import type { SchemaInfo } from "./schema-cache";

export function getCurrentWord(line: string, col: number): string {
  const before = line.slice(0, col);
  return before.match(/[a-zA-Z_][a-zA-Z0-9_]*$/)?.[0] ?? "";
}

export function getSuggestion(
  word: string,
  schema: SchemaInfo | null,
  contextLine: string
): string | null {
  if (word.length < 2) return null;

  const upper = word.toUpperCase();
  const lower = word.toLowerCase();

  // キーワード補完（大文字で返す）
  for (const kw of KEYWORDS) {
    if (kw.startsWith(upper) && kw !== upper) return kw;
  }

  if (!schema) return null;

  // テーブル名補完
  const tableMatch = schema.tables.find(
    (t) => t.toLowerCase().startsWith(lower) && t.toLowerCase() !== lower
  );
  if (tableMatch) return tableMatch;

  // カラム名補完（FROM/JOIN 後にテーブルが特定できる場合）
  const fromMatch = contextLine.match(/\bFROM\s+(\w+)/i) ?? contextLine.match(/\bJOIN\s+(\w+)/i);
  if (fromMatch) {
    const tableName = fromMatch[1]!.toLowerCase();
    const cols = schema.columns[tableName] ?? schema.columns[Object.keys(schema.columns).find(k => k.toLowerCase() === tableName) ?? ""] ?? [];
    const colMatch = cols.find(
      (c) => c.toLowerCase().startsWith(lower) && c.toLowerCase() !== lower
    );
    if (colMatch) return colMatch;
  }

  // 全カラムから補完
  for (const cols of Object.values(schema.columns)) {
    const colMatch = cols.find(
      (c) => c.toLowerCase().startsWith(lower) && c.toLowerCase() !== lower
    );
    if (colMatch) return colMatch;
  }

  return null;
}

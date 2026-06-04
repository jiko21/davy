import type { SQL } from "bun";
import type { QueryResult } from "../types/query";

export async function runQuery(sqlText: string, sql: SQL): Promise<QueryResult> {
  const start = Date.now();
  const rows = await sql.unsafe(sqlText);
  const duration = Date.now() - start;

  const columns = rows.length > 0 ? Object.keys(rows[0] as object) : [];

  return {
    columns,
    rows: rows as Record<string, unknown>[],
    duration,
    rowCount: rows.length,
    sql: sqlText,
  };
}

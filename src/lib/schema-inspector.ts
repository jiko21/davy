import type { SQL } from "bun";
import type { QueryResult } from "../types/query";

export async function listTables(sql: SQL): Promise<QueryResult> {
  const start = Date.now();
  const rows = await sql.unsafe(`
    SELECT
      t.table_name,
      t.table_type,
      obj_description(('"' || t.table_schema || '"."' || t.table_name || '"')::regclass, 'pg_class') AS comment
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    ORDER BY t.table_type, t.table_name
  `) as Record<string, unknown>[];

  return {
    columns: ["table_name", "table_type", "comment"],
    rows,
    duration: Date.now() - start,
    rowCount: rows.length,
    sql: "\\d",
  };
}

export async function describeTable(sql: SQL, tableName: string): Promise<QueryResult> {
  const start = Date.now();
  const rows = await sql.unsafe(`
    SELECT
      c.column_name,
      CASE
        WHEN c.character_maximum_length IS NOT NULL
          THEN c.data_type || '(' || c.character_maximum_length || ')'
        WHEN c.numeric_precision IS NOT NULL AND c.data_type IN ('numeric', 'decimal')
          THEN c.data_type || '(' || c.numeric_precision || ',' || c.numeric_scale || ')'
        ELSE c.data_type
      END AS type,
      c.is_nullable,
      c.column_default,
      COALESCE(
        (
          SELECT string_agg(tc.constraint_type, ', ' ORDER BY tc.constraint_type)
          FROM information_schema.key_column_usage kcu
          JOIN information_schema.table_constraints tc
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
            AND tc.table_name = kcu.table_name
          WHERE kcu.table_schema = 'public'
            AND kcu.table_name = c.table_name
            AND kcu.column_name = c.column_name
        ), ''
      ) AS constraints
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = $1
    ORDER BY c.ordinal_position
  `, [tableName]) as Record<string, unknown>[];

  return {
    columns: ["column_name", "type", "is_nullable", "column_default", "constraints"],
    rows,
    duration: Date.now() - start,
    rowCount: rows.length,
    sql: `\\d ${tableName}`,
  };
}

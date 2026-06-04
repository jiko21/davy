import type { SQL } from "bun";

export interface SchemaInfo {
  tables: string[];
  columns: Record<string, string[]>;
}

const cache = new Map<string, SchemaInfo>();

export async function fetchSchema(sql: SQL, profileName: string): Promise<SchemaInfo> {
  if (cache.has(profileName)) return cache.get(profileName)!;

  const rows = await sql.unsafe(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `) as { table_name: string; column_name: string }[];

  const tables = [...new Set(rows.map((r) => r.table_name))];
  const columns: Record<string, string[]> = {};
  for (const row of rows) {
    if (!columns[row.table_name]) columns[row.table_name] = [];
    columns[row.table_name]!.push(row.column_name);
  }

  const info: SchemaInfo = { tables, columns };
  cache.set(profileName, info);
  return info;
}

export function clearSchemaCache(profileName: string) {
  cache.delete(profileName);
}

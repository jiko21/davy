import type { QueryResult } from "../types/query";

function escapeCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return str;
}

function csvQuote(value: unknown): string {
  const str = escapeCell(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(result: QueryResult): string {
  const lines: string[] = [];
  lines.push(result.columns.map(csvQuote).join(","));
  for (const row of result.rows) {
    lines.push(result.columns.map((col) => csvQuote(row[col])).join(","));
  }
  return lines.join("\n");
}

export function toJson(result: QueryResult): string {
  return JSON.stringify(result.rows, null, 2);
}

export function toMarkdown(result: QueryResult): string {
  const lines: string[] = [];
  lines.push("| " + result.columns.join(" | ") + " |");
  lines.push("| " + result.columns.map(() => "---").join(" | ") + " |");
  for (const row of result.rows) {
    lines.push("| " + result.columns.map((col) => escapeCell(row[col]).replace(/\|/g, "\\|")).join(" | ") + " |");
  }
  return lines.join("\n");
}

export function toTable(result: QueryResult): string {
  if (result.columns.length === 0) return "(no columns)";

  const colWidths: number[] = result.columns.map((col) => col.length);
  for (const row of result.rows) {
    result.columns.forEach((col, i) => {
      const val = escapeCell(row[col]);
      colWidths[i] = Math.max(colWidths[i] ?? 0, val.length);
    });
  }

  function pad(str: string, width: number): string {
    const s = str.length > width ? str.slice(0, width - 1) + "…" : str;
    return s.padEnd(width);
  }

  const top = "┌" + colWidths.map((w) => "─".repeat((w ?? 0) + 2)).join("┬") + "┐";
  const mid = "├" + colWidths.map((w) => "─".repeat((w ?? 0) + 2)).join("┼") + "┤";
  const bot = "└" + colWidths.map((w) => "─".repeat((w ?? 0) + 2)).join("┴") + "┘";

  const header = "│ " + result.columns.map((col, i) => pad(col, colWidths[i] ?? 0)).join(" │ ") + " │";
  const dataRows = result.rows.map(
    (row) =>
      "│ " +
      result.columns.map((col, i) => pad(escapeCell(row[col]), colWidths[i] ?? 0)).join(" │ ") +
      " │"
  );

  return [top, header, mid, ...dataRows, bot].join("\n");
}

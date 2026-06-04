import React from "react";
import { Box, Text } from "ink";
import type { QueryResult, OutputFormat } from "../types/query";
import { toCsv, toJson, toMarkdown, toTable } from "../lib/formatters";

interface Props {
  result: QueryResult;
  format: OutputFormat;
  scrollTop?: number;
  visibleRows?: number;
  colOffset?: number;
  termCols?: number;
}

function hscroll(line: string, colOffset: number, termCols: number): string {
  return line.slice(colOffset, colOffset + termCols);
}

export default function ResultTable({
  result,
  format,
  scrollTop = 0,
  visibleRows,
  colOffset = 0,
  termCols = 9999,
}: Props) {
  if (result.columns.length === 0 && result.rowCount === 0) {
    return <Text color="green">クエリが正常に実行されました（結果なし）</Text>;
  }

  let lines: string[];

  if (format === "json") {
    const allLines = toJson(result).split("\n");
    lines = visibleRows !== undefined
      ? allLines.slice(scrollTop, scrollTop + visibleRows)
      : allLines;
  } else if (format === "csv") {
    const allLines = toCsv(result).split("\n");
    const header = allLines[0] ?? "";
    const dataLines = allLines.slice(1);
    const visible = visibleRows !== undefined
      ? dataLines.slice(scrollTop, scrollTop + Math.max(1, visibleRows - 1))
      : dataLines;
    lines = [header, ...visible];
  } else if (format === "markdown") {
    const allLines = toMarkdown(result).split("\n");
    const headerLines = allLines.slice(0, 2);
    const dataLines = allLines.slice(2);
    const visible = visibleRows !== undefined
      ? dataLines.slice(scrollTop, scrollTop + Math.max(1, visibleRows - 2))
      : dataLines;
    lines = [...headerLines, ...visible];
  } else {
    const allLines = toTable(result).split("\n");
    const headerLines = allLines.slice(0, 3);
    const footerLine = allLines.at(-1) ?? "";
    const dataLines = allLines.slice(3, -1);
    const visible = visibleRows !== undefined
      ? dataLines.slice(scrollTop, scrollTop + Math.max(1, visibleRows - 4))
      : dataLines;
    lines = [...headerLines, ...visible, footerLine];
  }

  return (
    <Box flexDirection="column">
      {lines.map((line, i) => (
        <Text key={i} wrap="truncate">
          {hscroll(line, colOffset, termCols)}
        </Text>
      ))}
    </Box>
  );
}

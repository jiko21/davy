import React, { useState, useEffect, useMemo } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import type { QueryResult, OutputFormat } from "../types/query";
import ResultTable from "./ResultTable";
import FormatSelector from "./FormatSelector";
import { toCsv, toJson, toMarkdown, toTable } from "../lib/formatters";
import { copyToClipboard } from "../lib/clipboard";

// フォーマット別のテーブル固定行数（ヘッダー + フッター）
const FIXED_LINES: Record<OutputFormat, number> = { table: 4, csv: 1, markdown: 2, json: 0 };

interface Props {
  result: QueryResult;
  onBack: () => void;
  onSwitchProfile: () => void;
  visibleRows?: number;
  isActive?: boolean;
}

export default function ResultView({ result, onBack, onSwitchProfile, visibleRows = 10, isActive = true }: Props) {
  const { stdout } = useStdout();
  const termCols = stdout.columns ?? 80;

  const [format, setFormat] = useState<OutputFormat>("table");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [scrollTop, setScrollTop] = useState(0);
  const [colOffset, setColOffset] = useState(0);

  // フォーマット別のスクロール可能な総行数
  const totalScrollableLines = useMemo(() => {
    if (format === "json") return toJson(result).split("\n").length;
    return result.rows.length;
  }, [result, format]);

  // フォーマット別の表示可能データ行数（固定ヘッダー/フッターを除いた分）
  const visibleDataRows = Math.max(1, visibleRows - FIXED_LINES[format]);

  const maxScrollTop = Math.max(0, totalScrollableLines - visibleDataRows);

  useEffect(() => {
    setScrollTop(0);
    setColOffset(0);
  }, [format]);

  // scrollTop がフォーマット変更後に範囲外になる場合のクランプ
  const clampedScrollTop = Math.min(scrollTop, maxScrollTop);

  async function handleCopy() {
    try {
      let text = "";
      if (format === "csv") text = toCsv(result);
      else if (format === "json") text = toJson(result);
      else if (format === "markdown") text = toMarkdown(result);
      else text = toTable(result);
      await copyToClipboard(text);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 1500);
    }
  }

  useInput((input, key) => {
    if (key.tab) { onBack(); return; }
    if (key.ctrl && input === "p") { onSwitchProfile(); return; }
    if (input.toLowerCase() === "c") { handleCopy(); return; }
    if (key.upArrow) { setScrollTop((t) => Math.max(0, t - 1)); return; }
    if (key.downArrow) { setScrollTop((t) => Math.min(maxScrollTop, t + 1)); return; }
    if (key.leftArrow) { setColOffset((c) => Math.max(0, c - 5)); return; }
    if (key.rightArrow) { setColOffset((c) => c + 5); return; }
  }, { isActive });

  const borderColor = isActive ? "green" : "gray";
  const showScrollInfo = totalScrollableLines > visibleDataRows;

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box borderStyle="round" borderColor={borderColor} paddingX={1} flexGrow={1} flexDirection="column">
        <Box marginBottom={1} justifyContent="space-between">
          <Text color={borderColor} bold>クエリ結果{isActive ? "" : "  [Tab で切替]"}</Text>
          {copyStatus === "copied" && <Text color="green">✓ クリップボードにコピーしました</Text>}
          {copyStatus === "error" && <Text color="red">コピーに失敗しました</Text>}
        </Box>
        <FormatSelector current={format} onChange={setFormat} isActive={isActive} />
        <Text> </Text>
        <ResultTable
          result={result}
          format={format}
          scrollTop={clampedScrollTop}
          visibleRows={visibleRows}
          colOffset={colOffset}
          termCols={termCols - 4}
        />
      </Box>
      <Box paddingX={1} justifyContent="space-between">
        <Text color="gray" dimColor>Tab:エディタへ  c:コピー  f:フォーマット切替  ↑↓:縦スクロール  ←→:横スクロール</Text>
        {showScrollInfo && (
          <Text color="gray" dimColor>
            {clampedScrollTop + 1}–{Math.min(clampedScrollTop + visibleDataRows, totalScrollableLines)} / {totalScrollableLines}
          </Text>
        )}
      </Box>
    </Box>
  );
}

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { renderHighlightedLine } from "../lib/syntax-highlight";
import { getCurrentWord, getSuggestion } from "../lib/autocomplete";
import type { SchemaInfo } from "../lib/schema-cache";

interface Props {
  onExecute: (sql: string) => void;
  onSwitchProfile: () => void;
  onFocusResult?: () => void;
  onChange?: (sql: string) => void;
  initialValue?: string;
  visibleRows?: number;
  isActive?: boolean;
  schema?: SchemaInfo | null;
}

interface Cursor {
  row: number;
  col: number;
}

export default function SqlEditor({
  onExecute,
  onSwitchProfile,
  onFocusResult,
  onChange,
  initialValue = "",
  visibleRows = 10,
  isActive = true,
  schema = null,
}: Props) {
  const [lines, setLines] = useState<string[]>(
    initialValue ? initialValue.split("\n") : [""]
  );
  const [cursor, setCursor] = useState<Cursor>({ row: 0, col: 0 });
  const [scrollTop, setScrollTop] = useState(0);

  const currentSql = useCallback(() => lines.join("\n"), [lines]);

  useEffect(() => {
    onChange?.(lines.join("\n"));
  }, [lines]);

  // ghosttext の計算
  const suggestion = useMemo(() => {
    const line = lines[cursor.row] ?? "";
    const word = getCurrentWord(line, cursor.col);
    if (!word) return null;
    const s = getSuggestion(word, schema, line);
    if (!s) return null;
    // カーソルが行末にないとghostedtextが邪魔なので行末のみ表示
    if (cursor.col !== line.length) return null;
    return s.slice(word.length); // まだ入力されていない残り部分
  }, [lines, cursor, schema]);

  function adjustScroll(newCursor: Cursor) {
    setScrollTop((top) => {
      if (newCursor.row < top) return newCursor.row;
      if (newCursor.row >= top + visibleRows) return newCursor.row - visibleRows + 1;
      return top;
    });
  }

  useInput((input, key) => {
    if (key.ctrl && input === "x") {
      const sql = currentSql().trim();
      if (sql) onExecute(sql);
      return;
    }
    if (key.ctrl && input === "l") {
      setLines([""]);
      setCursor({ row: 0, col: 0 });
      setScrollTop(0);
      return;
    }
    if (key.ctrl && input === "p") {
      onSwitchProfile();
      return;
    }

    // Tab: 結果パネルへフォーカス
    if (key.tab) {
      onFocusResult?.();
      return;
    }

    // 行末で右矢印: ゴーストテキスト補完確定
    if (key.rightArrow && suggestion && cursor.col === (lines[cursor.row]?.length ?? 0)) {
      setLines((prev) => {
        const next = [...prev];
        const line = next[cursor.row] ?? "";
        next[cursor.row] = line + suggestion;
        return next;
      });
      const newCursor = { ...cursor, col: cursor.col + suggestion.length };
      setCursor(newCursor);
      adjustScroll(newCursor);
      return;
    }

    if (key.return) {
      setLines((prev) => {
        const next = [...prev];
        const currentLine = next[cursor.row] ?? "";
        next[cursor.row] = currentLine.slice(0, cursor.col);
        next.splice(cursor.row + 1, 0, currentLine.slice(cursor.col));
        return next;
      });
      const newCursor = { row: cursor.row + 1, col: 0 };
      setCursor(newCursor);
      adjustScroll(newCursor);
      return;
    }

    if (key.backspace || key.delete) {
      setLines((prev) => {
        const next = [...prev];
        if (cursor.col > 0) {
          const line = next[cursor.row] ?? "";
          next[cursor.row] = line.slice(0, cursor.col - 1) + line.slice(cursor.col);
          const newCursor = { ...cursor, col: cursor.col - 1 };
          setCursor(newCursor);
          adjustScroll(newCursor);
        } else if (cursor.row > 0) {
          const prevLine = next[cursor.row - 1] ?? "";
          const currentLine = next[cursor.row] ?? "";
          const newCol = prevLine.length;
          next[cursor.row - 1] = prevLine + currentLine;
          next.splice(cursor.row, 1);
          const newCursor = { row: cursor.row - 1, col: newCol };
          setCursor(newCursor);
          adjustScroll(newCursor);
        }
        return next;
      });
      return;
    }

    if (key.upArrow) {
      if (cursor.row > 0) {
        const newCursor = {
          row: cursor.row - 1,
          col: Math.min(cursor.col, lines[cursor.row - 1]?.length ?? 0),
        };
        setCursor(newCursor);
        adjustScroll(newCursor);
      }
      return;
    }
    if (key.downArrow) {
      if (cursor.row < lines.length - 1) {
        const newCursor = {
          row: cursor.row + 1,
          col: Math.min(cursor.col, lines[cursor.row + 1]?.length ?? 0),
        };
        setCursor(newCursor);
        adjustScroll(newCursor);
      }
      return;
    }
    if (key.leftArrow) {
      if (cursor.col > 0) {
        const newCursor = { ...cursor, col: cursor.col - 1 };
        setCursor(newCursor);
        adjustScroll(newCursor);
      } else if (cursor.row > 0) {
        const newCursor = { row: cursor.row - 1, col: lines[cursor.row - 1]?.length ?? 0 };
        setCursor(newCursor);
        adjustScroll(newCursor);
      }
      return;
    }
    if (key.rightArrow) {
      if (cursor.col < (lines[cursor.row]?.length ?? 0)) {
        const newCursor = { ...cursor, col: cursor.col + 1 };
        setCursor(newCursor);
        adjustScroll(newCursor);
      } else if (cursor.row < lines.length - 1) {
        const newCursor = { row: cursor.row + 1, col: 0 };
        setCursor(newCursor);
        adjustScroll(newCursor);
      }
      return;
    }

    if (input && !key.ctrl && !key.meta && input.length === 1) {
      setLines((prev) => {
        const next = [...prev];
        const line = next[cursor.row] ?? "";
        next[cursor.row] = line.slice(0, cursor.col) + input + line.slice(cursor.col);
        return next;
      });
      const newCursor = { ...cursor, col: cursor.col + 1 };
      setCursor(newCursor);
      adjustScroll(newCursor);
    }
  }, { isActive });

  const visibleLines = lines.slice(scrollTop, scrollTop + visibleRows);
  const borderColor = isActive ? "cyan" : "gray";

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1} flexGrow={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text color={borderColor} bold>SQL エディタ{isActive ? "" : "  [Tab で切替]"}</Text>
        {isActive && (
          <Text color="gray" dimColor>
            Ctrl+X:実行  Ctrl+L:クリア  {suggestion ? "→:補完  " : ""}Ctrl+P:プロファイル変更
          </Text>
        )}
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        {visibleLines.map((line, visIdx) => {
          const rowIdx = scrollTop + visIdx;
          const isCursorRow = rowIdx === cursor.row;
          return (
            <Box key={rowIdx}>
              <Text color="gray" dimColor>{String(rowIdx + 1).padStart(3, " ")} </Text>
              {isCursorRow ? (
                <Text>
                  {renderHighlightedLine(line.slice(0, cursor.col))}
                  <Text backgroundColor="white" color="black">
                    {line[cursor.col] ?? " "}
                  </Text>
                  {renderHighlightedLine(line.slice(cursor.col + 1))}
                  {suggestion && <Text color="gray" dimColor>{suggestion}</Text>}
                </Text>
              ) : (
                renderHighlightedLine(line)
              )}
            </Box>
          );
        })}
      </Box>
      {lines.length > visibleRows && (
        <Text color="gray" dimColor>
          {scrollTop + 1}–{Math.min(scrollTop + visibleRows, lines.length)} / {lines.length} 行
        </Text>
      )}
    </Box>
  );
}

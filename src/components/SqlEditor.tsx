import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { renderHighlightedLine } from "../lib/syntax-highlight";

interface Props {
  onExecute: (sql: string) => void;
  onSwitchProfile: () => void;
  onFocusResult?: () => void;
  initialValue?: string;
  visibleRows?: number;
  isActive?: boolean;
}

interface Cursor {
  row: number;
  col: number;
}

export default function SqlEditor({
  onExecute,
  onSwitchProfile,
  onFocusResult,
  initialValue = "",
  visibleRows = 10,
  isActive = true,
}: Props) {
  const [lines, setLines] = useState<string[]>(
    initialValue ? initialValue.split("\n") : [""]
  );
  const [cursor, setCursor] = useState<Cursor>({ row: 0, col: 0 });
  const [scrollTop, setScrollTop] = useState(0);

  const currentSql = useCallback(() => lines.join("\n"), [lines]);

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
    if (key.tab && onFocusResult) {
      onFocusResult();
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
        {isActive && <Text color="gray" dimColor>Ctrl+X:実行  Ctrl+L:クリア  Tab:結果へ  Ctrl+P:プロファイル変更</Text>}
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        {visibleLines.map((line, visIdx) => {
          const rowIdx = scrollTop + visIdx;
          return (
            <Box key={rowIdx}>
              <Text color="gray" dimColor>{String(rowIdx + 1).padStart(3, " ")} </Text>
              {rowIdx === cursor.row ? (
                <Text>
                  {renderHighlightedLine(line.slice(0, cursor.col))}
                  <Text backgroundColor="white" color="black">
                    {line[cursor.col] ?? " "}
                  </Text>
                  {renderHighlightedLine(line.slice(cursor.col + 1))}
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

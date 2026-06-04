import React from "react";
import { Box, Text, useInput } from "ink";
import type { OutputFormat } from "../types/query";

const FORMATS: OutputFormat[] = ["table", "csv", "json", "markdown"];
const FORMAT_LABELS: Record<OutputFormat, string> = {
  table: "Table",
  csv: "CSV",
  json: "JSON",
  markdown: "Markdown",
};

interface Props {
  current: OutputFormat;
  onChange: (format: OutputFormat) => void;
  isActive?: boolean;
}

export default function FormatSelector({ current, onChange, isActive = true }: Props) {
  useInput((input) => {
    if (input.toLowerCase() === "f") {
      const idx = FORMATS.indexOf(current);
      const next = FORMATS[(idx + 1) % FORMATS.length];
      if (next) onChange(next);
    }
  }, { isActive });

  return (
    <Box gap={2}>
      <Text color="gray">形式:</Text>
      {FORMATS.map((fmt) => (
        <Text key={fmt} color={fmt === current ? "cyan" : "gray"} bold={fmt === current}>
          {FORMAT_LABELS[fmt]}{fmt === current ? " ◀" : ""}
        </Text>
      ))}
      <Text color="gray" dimColor>（f で切替）</Text>
    </Box>
  );
}

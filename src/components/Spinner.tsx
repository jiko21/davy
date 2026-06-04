import React from "react";
import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";

interface Props {
  label?: string;
}

export default function Spinner({ label = "実行中..." }: Props) {
  return (
    <Box gap={1}>
      <Text color="cyan"><InkSpinner type="dots" /></Text>
      <Text>{label}</Text>
    </Box>
  );
}

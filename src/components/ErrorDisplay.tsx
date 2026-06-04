import React from "react";
import { Box, Text, useInput } from "ink";

interface Props {
  error: Error;
  onBack: () => void;
}

export default function ErrorDisplay({ error, onBack }: Props) {
  useInput((input, key) => {
    if (input.toLowerCase() === "e" || (key.ctrl && input.toLowerCase() === "x")) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="red" padding={1}>
      <Text color="red" bold>エラーが発生しました</Text>
      <Text> </Text>
      <Text>{error.message}</Text>
      {(error as { code?: string }).code && (
        <Text color="gray">code: {(error as { code?: string }).code}</Text>
      )}
      <Text> </Text>
      <Text color="gray" dimColor>e でエディタに戻る</Text>
    </Box>
  );
}

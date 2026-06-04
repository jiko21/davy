import React from "react";
import { Box, Text } from "ink";
import type { Profile } from "../types/config";
import type { AppMode, TabMode } from "../types/query";

type AnyMode = AppMode | TabMode;

interface Props {
  profile: Profile | null;
  mode: AnyMode;
  rowCount?: number;
  duration?: number;
}

const MODE_HINTS: Partial<Record<AnyMode, string>> = {
  editor: "Ctrl+X:実行  Ctrl+L:クリア  Tab:結果へ  Ctrl+T:新規タブ  Ctrl+N/B:タブ切替",
  results: "Tab:エディタへ  c:コピー  f:フォーマット切替  ↑↓←→:スクロール  Ctrl+T:新規タブ",
  "profile-select": "↑↓:選択  Enter:決定",
};

export default function StatusBar({ profile, mode, rowCount, duration }: Props) {
  const hint = MODE_HINTS[mode] ?? "";
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="row" justifyContent="space-between">
      <Box gap={2}>
        {profile && (
          <Text color="cyan">
            {profile.name} ({profile.username}@{profile.host}:{profile.port}/{profile.database})
          </Text>
        )}
        {rowCount !== undefined && <Text color="green">{rowCount} rows</Text>}
        {duration !== undefined && <Text color="yellow">{duration}ms</Text>}
      </Box>
      <Text color="gray" dimColor>{hint}</Text>
    </Box>
  );
}

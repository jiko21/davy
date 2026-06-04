import React from "react";
import { Box, Text } from "ink";
import type { Profile } from "../types/config";
import type { AppMode } from "../types/query";

interface Props {
  profile: Profile | null;
  mode: AppMode;
  rowCount?: number;
  duration?: number;
}

const MODE_HINTS: Partial<Record<AppMode, string>> = {
  editor: "Ctrl+X:実行  Ctrl+L:クリア  Ctrl+P:プロファイル変更",
  results: "f:フォーマット切替  c:コピー  e:エディタへ戻る  Ctrl+P:プロファイル変更",
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

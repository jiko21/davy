import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { Profile } from "../types/config";

interface Props {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
  onAddNew: () => void;
}

export default function ProfileSelector({ profiles, onSelect, onAddNew }: Props) {
  const items = [
    ...profiles.map((p) => ({
      label: `${p.name}  (${p.username}@${p.host}:${p.port}/${p.database})`,
      value: p.name,
    })),
    { label: "+ 新しいプロファイルを追加", value: "__add__" },
  ];

  function handleSelect(item: { value: string }) {
    if (item.value === "__add__") {
      onAddNew();
    } else {
      const profile = profiles.find((p) => p.name === item.value);
      if (profile) onSelect(profile);
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>接続するプロファイルを選択</Text>
      <Text> </Text>
      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
}

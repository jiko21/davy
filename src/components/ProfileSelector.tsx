import React, { useState } from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { Profile } from "../types/config";

interface Props {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
  onAddNew: () => void;
  onDelete?: (profile: Profile) => void;
}

export default function ProfileSelector({ profiles, onSelect, onAddNew, onDelete }: Props) {
  const [deleteMode, setDeleteMode] = useState(false);

  const selectItems = [
    ...profiles.map((p) => ({
      label: `${p.name}  (${p.username}@${p.host}:${p.port}/${p.database})`,
      value: p.name,
    })),
    { label: "+ 新しいプロファイルを追加", value: "__add__" },
    ...(onDelete ? [{ label: "削除...", value: "__delete__" }] : []),
  ];

  const deleteItems = [
    ...profiles.map((p) => ({
      label: `[削除] ${p.name}  (${p.username}@${p.host}:${p.port}/${p.database})`,
      value: p.name,
    })),
    { label: "← キャンセル", value: "__cancel__" },
  ];

  function handleSelect(item: { value: string }) {
    if (item.value === "__add__") {
      onAddNew();
    } else if (item.value === "__delete__") {
      setDeleteMode(true);
    } else {
      const profile = profiles.find((p) => p.name === item.value);
      if (profile) onSelect(profile);
    }
  }

  function handleDeleteSelect(item: { value: string }) {
    if (item.value === "__cancel__") {
      setDeleteMode(false);
      return;
    }
    const profile = profiles.find((p) => p.name === item.value);
    if (profile && onDelete) {
      onDelete(profile);
      setDeleteMode(false);
    }
  }

  if (deleteMode) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="red">削除するプロファイルを選択</Text>
        <Text> </Text>
        <SelectInput items={deleteItems} onSelect={handleDeleteSelect} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>接続するプロファイルを選択</Text>
      <Text> </Text>
      <SelectInput items={selectItems} onSelect={handleSelect} />
    </Box>
  );
}

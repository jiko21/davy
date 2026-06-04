import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type { Profile } from "../types/config";
import { defaultProfile } from "../types/config";

interface Props {
  initial?: Partial<Profile>;
  onSave: (profile: Profile) => void;
  onCancel: () => void;
}

type Field = keyof Profile;
const FIELDS: { key: Field; label: string; secret?: boolean }[] = [
  { key: "name", label: "プロファイル名" },
  { key: "host", label: "ホスト" },
  { key: "port", label: "ポート" },
  { key: "database", label: "データベース名" },
  { key: "username", label: "ユーザー名" },
  { key: "password", label: "パスワード", secret: true },
  { key: "ssl", label: "SSL (true/false)" },
];

export default function ProfileForm({ initial, onSave, onCancel }: Props) {
  const base = { ...defaultProfile(), ...initial };
  const [values, setValues] = useState<Record<Field, string>>({
    name: base.name,
    host: base.host,
    port: String(base.port),
    database: base.database,
    username: base.username,
    password: base.password,
    ssl: String(base.ssl),
  });
  const [fieldIndex, setFieldIndex] = useState(0);
  const [error, setError] = useState("");

  const currentField = FIELDS[fieldIndex]!;

  function handleSubmit(value: string) {
    setValues((prev) => ({ ...prev, [currentField.key]: value }));
    if (fieldIndex < FIELDS.length - 1) {
      setFieldIndex((i) => i + 1);
    } else {
      const port = parseInt(values.port, 10);
      if (!values.name.trim()) { setError("プロファイル名は必須です"); setFieldIndex(0); return; }
      if (!values.database.trim()) { setError("データベース名は必須です"); setFieldIndex(3); return; }
      if (isNaN(port)) { setError("ポートは数値で入力してください"); setFieldIndex(2); return; }
      onSave({
        name: values.name.trim(),
        host: values.host || "localhost",
        port,
        database: values.database.trim(),
        username: values.username || "postgres",
        password: values.password,
        ssl: value === "true",
      });
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>プロファイル設定</Text>
      <Text> </Text>
      {FIELDS.map((field, i) => (
        <Box key={field.key} gap={1}>
          <Text color={i === fieldIndex ? "cyan" : "gray"}>
            {i === fieldIndex ? "▶" : " "} {field.label}:
          </Text>
          {i === fieldIndex ? (
            <TextInput
              value={values[field.key]}
              onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
              onSubmit={handleSubmit}
              mask={field.secret ? "*" : undefined}
            />
          ) : (
            <Text color="white">
              {field.secret ? "*".repeat(values[field.key].length) : (values[field.key] || "-")}
            </Text>
          )}
        </Box>
      ))}
      {error && <Text color="red">{error}</Text>}
      <Text> </Text>
      <Text color="gray" dimColor>Enter で次の項目へ進む</Text>
    </Box>
  );
}

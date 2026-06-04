import React from "react";
import { Box, Text } from "ink";
import ProfileForm from "./ProfileForm";
import type { Config, Profile } from "../types/config";

interface Props {
  onComplete: (config: Config) => void;
}

export default function SetupWizard({ onComplete }: Props) {
  function handleSave(profile: Profile) {
    onComplete({
      version: 1,
      activeProfile: profile.name,
      profiles: [profile],
    });
  }

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1} marginBottom={1}>
        <Text color="cyan" bold>Davy SQL — 初回セットアップ</Text>
      </Box>
      <Text color="gray">最初のプロファイルを設定してください。</Text>
      <Text> </Text>
      <ProfileForm onSave={handleSave} onCancel={() => {}} />
    </Box>
  );
}

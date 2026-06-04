import React from "react";
import { Box, Text } from "ink";
import type { Tab } from "../types/query";
import type { Config } from "../types/config";

interface Props {
  tabs: Tab[];
  activeTabId: number;
  config: Config | null;
}

function tabLabel(tab: Tab, index: number): string {
  const prefix = `${index + 1}`;
  const sql = tab.sql.trim().replace(/\s+/g, " ");
  const preview = sql ? (sql.length > 16 ? sql.slice(0, 16) + "…" : sql) : "(空)";
  return `${prefix}:${tab.profileName} – ${preview}`;
}

function tabStatusColor(tab: Tab): string {
  if (tab.mode === "loading") return "yellow";
  if (tab.mode === "error") return "red";
  if (tab.mode === "results") return "green";
  if (tab.mode === "profile-select") return "cyan";
  return "white";
}

export default function TabBar({ tabs, activeTabId }: Props) {
  return (
    <Box gap={1} paddingX={1}>
      {tabs.map((tab, i) => {
        const isActive = tab.id === activeTabId;
        const color = tabStatusColor(tab);
        return (
          <Text
            key={tab.id}
            color={isActive ? color : "gray"}
            bold={isActive}
            underline={isActive}
          >
            {isActive ? `[${tabLabel(tab, i)}]` : ` ${tabLabel(tab, i)} `}
          </Text>
        );
      })}
      <Text color="gray" dimColor>  Ctrl+T:新規  Ctrl+W:閉じる  Ctrl+N/B:切替</Text>
    </Box>
  );
}

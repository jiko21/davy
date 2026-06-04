import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import type { Config, Profile } from "./types/config";
import type { AppMode, Tab } from "./types/query";
import { newTab } from "./types/query";
import { loadConfig, saveConfig } from "./lib/config";
import { connectionManager } from "./lib/connection";
import { runQuery } from "./lib/sql-executor";
import SetupWizard from "./components/SetupWizard";
import ProfileSelector from "./components/ProfileSelector";
import ProfileForm from "./components/ProfileForm";
import SqlEditor from "./components/SqlEditor";
import ResultView from "./components/ResultView";
import ErrorDisplay from "./components/ErrorDisplay";
import StatusBar from "./components/StatusBar";
import Spinner from "./components/Spinner";
import TabBar from "./components/TabBar";

const STATUS_BAR_HEIGHT = 3;
const TAB_BAR_HEIGHT = 1;

interface Props {
  initialConfig: Config | null;
}

export default function App({ initialConfig }: Props) {
  const { exit } = useApp();
  const [config, setConfig] = useState<Config | null>(initialConfig);
  const [appMode, setAppMode] = useState<AppMode>(initialConfig ? "profile-select" : "setup");
  const [termRows, setTermRows] = useState(process.stdout.rows ?? 24);

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  useEffect(() => {
    const onResize = () => setTermRows(process.stdout.rows ?? 24);
    process.stdout.on("resize", onResize);
    return () => { process.stdout.off("resize", onResize); };
  }, []);

  useEffect(() => {
    const cleanup = async () => { await connectionManager.disconnectAll(); };
    process.on("SIGINT", () => { cleanup().then(() => exit()); });
    return () => { cleanup(); };
  }, [exit]);

  function updateTab(id: number, updates: Partial<Tab>) {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  const addTab = useCallback((profileName: string) => {
    const tab = newTab(nextTabId, profileName);
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(nextTabId);
    setNextTabId((n) => n + 1);
  }, [nextTabId]);

  const closeTab = useCallback((id: number) => {
    if (tabs.length === 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    if (activeTabId === id) {
      setActiveTabId(newTabs[Math.min(idx, newTabs.length - 1)]!.id);
    }
    setTabs(newTabs);
  }, [tabs, activeTabId]);

  const switchToNext = useCallback(() => {
    const idx = tabs.findIndex((t) => t.id === activeTabId);
    setActiveTabId(tabs[(idx + 1) % tabs.length]!.id);
  }, [tabs, activeTabId]);

  const switchToPrev = useCallback(() => {
    const idx = tabs.findIndex((t) => t.id === activeTabId);
    setActiveTabId(tabs[(idx - 1 + tabs.length) % tabs.length]!.id);
  }, [tabs, activeTabId]);

  useInput((input, key) => {
    if (appMode !== "main") return;
    if (key.ctrl && input === "t") {
      addTab(activeTab?.profileName ?? config?.profiles[0]?.name ?? "");
      return;
    }
    if (key.ctrl && input === "w") { closeTab(activeTabId); return; }
    if (key.ctrl && input === "n") { switchToNext(); return; }
    if (key.ctrl && input === "b") { switchToPrev(); return; }
  });

  const mainAreaRows = termRows - STATUS_BAR_HEIGHT;
  const editorRows = Math.max(6, Math.floor(mainAreaRows * 0.6) - TAB_BAR_HEIGHT);
  const bottomRows = Math.max(4, mainAreaRows - editorRows - TAB_BAR_HEIGHT);
  const RESULT_CHROME = 7;
  const resultVisibleRows = Math.max(1, bottomRows - RESULT_CHROME);

  async function handleSetupComplete(newConfig: Config) {
    await saveConfig(newConfig);
    setConfig(newConfig);
    setAppMode("profile-select");
  }

  async function handleInitialProfileSelect(profile: Profile) {
    setAppMode("connecting");
    try {
      const sql = connectionManager.connect(profile);
      await sql.unsafe("SELECT 1");
      if (config) {
        const updated = { ...config, activeProfile: profile.name };
        setConfig(updated);
        await saveConfig(updated);
      }
      // 最初のタブを作成
      const firstTab = newTab(1, profile.name);
      setTabs([firstTab]);
      setActiveTabId(1);
      setAppMode("main");
    } catch (err) {
      setAppMode("profile-select");
    }
  }

  async function handleAddConfig(profile: Profile) {
    if (!config) return;
    const updated: Config = {
      ...config,
      profiles: [...config.profiles.filter((p) => p.name !== profile.name), profile],
    };
    await saveConfig(updated);
    setConfig(updated);
    setAppMode("profile-select");
  }

  // タブ内プロファイル切り替え完了
  async function handleTabProfileSelect(profile: Profile) {
    if (!activeTab) return;
    // 接続確認
    try {
      const sql = connectionManager.connect(profile);
      await sql.unsafe("SELECT 1");
    } catch (err) {
      // 接続失敗でもプロファイルは更新（次のクエリ実行時にエラーになる）
    }
    updateTab(activeTabId, { profileName: profile.name, mode: "editor" });
  }

  async function handleExecute(sql: string) {
    if (!activeTab) return;
    const profile = config?.profiles.find((p) => p.name === activeTab.profileName);
    if (!profile) return;

    updateTab(activeTabId, { sql, mode: "loading", focus: "editor" });
    try {
      const connection = connectionManager.connect(profile);
      const result = await runQuery(sql, connection);
      updateTab(activeTabId, { result, mode: "results", focus: "result" });
    } catch (err) {
      updateTab(activeTabId, {
        error: err instanceof Error ? err : new Error(String(err)),
        mode: "error",
        focus: "editor",
      });
    }
  }

  const isMainMode = appMode === "main";
  const tabFocusedOnEditor = !activeTab || activeTab.focus === "editor";

  return (
    <Box flexDirection="column">
      {!isMainMode && (
        <Box flexDirection="column">
          {appMode === "setup" && (
            <SetupWizard onComplete={handleSetupComplete} />
          )}
          {appMode === "profile-select" && config && (
            <ProfileSelector
              profiles={config.profiles}
              onSelect={handleInitialProfileSelect}
              onAddNew={() => setAppMode("profile-form")}
            />
          )}
          {appMode === "profile-form" && (
            <ProfileForm
              onSave={handleAddConfig}
              onCancel={() => setAppMode("profile-select")}
            />
          )}
          {appMode === "connecting" && (
            <Spinner label="接続中..." />
          )}
        </Box>
      )}

      {isMainMode && activeTab && (
        <Box flexDirection="column">
          <Box height={TAB_BAR_HEIGHT}>
            <TabBar tabs={tabs} activeTabId={activeTabId} config={config} />
          </Box>

          {/* タブ内プロファイル選択 */}
          {activeTab.mode === "profile-select" && config && (
            <Box flexDirection="column" height={editorRows + bottomRows}>
              <ProfileSelector
                profiles={config.profiles}
                onSelect={handleTabProfileSelect}
                onAddNew={() => setAppMode("profile-form")}
              />
            </Box>
          )}

          {activeTab.mode !== "profile-select" && (
            <>
              <Box height={editorRows}>
                <SqlEditor
                  key={activeTabId}
                  onExecute={handleExecute}
                  onSwitchProfile={() => updateTab(activeTabId, { mode: "profile-select" })}
                  onFocusResult={
                    activeTab.result
                      ? () => updateTab(activeTabId, { focus: "result", mode: "results" })
                      : undefined
                  }
                  onChange={(sql) => updateTab(activeTabId, { sql })}
                  initialValue={activeTab.sql}
                  visibleRows={editorRows - 4}
                  isActive={tabFocusedOnEditor && activeTab.mode !== "loading"}
                />
              </Box>

              <Box height={bottomRows} flexDirection="column">
                {activeTab.mode === "loading" && (
                  <Box flexGrow={1} alignItems="center" justifyContent="center">
                    <Spinner label="クエリを実行中..." />
                  </Box>
                )}
                {activeTab.mode === "editor" && !activeTab.result && (
                  <Box flexGrow={1} alignItems="center" justifyContent="center">
                    <Text color="gray" dimColor>Ctrl+X でクエリを実行</Text>
                  </Box>
                )}
                {(activeTab.mode === "editor" || activeTab.mode === "results") && activeTab.result && (
                  <ResultView
                    result={activeTab.result}
                    onBack={() => updateTab(activeTabId, { focus: "editor", mode: "editor" })}
                    onSwitchProfile={() => updateTab(activeTabId, { mode: "profile-select" })}
                    visibleRows={resultVisibleRows}
                    isActive={!tabFocusedOnEditor}
                  />
                )}
                {activeTab.mode === "error" && activeTab.error && (
                  <ErrorDisplay
                    error={activeTab.error}
                    onBack={() => updateTab(activeTabId, { mode: "editor", focus: "editor" })}
                  />
                )}
              </Box>
            </>
          )}
        </Box>
      )}

      <StatusBar
        profile={
          isMainMode && activeTab && config
            ? (config.profiles.find((p) => p.name === activeTab.profileName) ?? null)
            : null
        }
        mode={
          isMainMode && activeTab
            ? activeTab.focus === "result" ? "results" : activeTab.mode
            : appMode as never
        }
        rowCount={activeTab?.result?.rowCount}
        duration={activeTab?.result?.duration}
      />
    </Box>
  );
}

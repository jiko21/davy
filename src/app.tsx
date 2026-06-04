import React, { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import type { Config, Profile } from "./types/config";
import type { AppMode, QueryResult } from "./types/query";
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

const STATUS_BAR_HEIGHT = 3;

interface Props {
  initialConfig: Config | null;
}

export default function App({ initialConfig }: Props) {
  const { exit } = useApp();
  const [config, setConfig] = useState<Config | null>(initialConfig);
  const [mode, setMode] = useState<AppMode>(initialConfig ? "profile-select" : "setup");
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [lastSql, setLastSql] = useState("");
  const [termRows, setTermRows] = useState(process.stdout.rows ?? 24);

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

  const mainAreaRows = termRows - STATUS_BAR_HEIGHT;
  const editorRows = Math.max(6, Math.floor(mainAreaRows * 0.6));
  const bottomRows = Math.max(4, mainAreaRows - editorRows);
  // ResultView の固定クロム: border上下(2) + タイトル行(1) + marginBottom(1) + FormatSelector(1) + 空白(1) + フッター(1)
  const RESULT_CHROME = 7;
  const resultVisibleRows = Math.max(1, bottomRows - RESULT_CHROME);

  const isMainMode = ["editor", "loading", "results", "error"].includes(mode);

  async function handleSetupComplete(newConfig: Config) {
    await saveConfig(newConfig);
    setConfig(newConfig);
    setMode("profile-select");
  }

  async function handleProfileSelect(profile: Profile) {
    setActiveProfile(profile);
    setMode("connecting");
    try {
      const sql = connectionManager.connect(profile);
      await sql.unsafe("SELECT 1");
      if (config) {
        const updated = { ...config, activeProfile: profile.name };
        setConfig(updated);
        await saveConfig(updated);
      }
      setMode("editor");
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setMode("error");
    }
  }

  async function handleAddProfile(profile: Profile) {
    if (!config) return;
    const updated: Config = {
      ...config,
      profiles: [...config.profiles.filter((p) => p.name !== profile.name), profile],
    };
    await saveConfig(updated);
    setConfig(updated);
    setMode("profile-select");
  }

  async function handleExecute(sql: string) {
    if (!activeProfile) return;
    setLastSql(sql);
    setMode("loading");
    try {
      const connection = connectionManager.connect(activeProfile);
      const result = await runQuery(sql, connection);
      setQueryResult(result);
      setMode("results");
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setMode("error");
    }
  }

  function handleSwitchProfile() {
    setMode("profile-select");
  }

  return (
    <Box flexDirection="column">
      {/* セットアップ / プロファイル選択画面は全体表示 */}
      {!isMainMode && (
        <Box flexDirection="column">
          {mode === "setup" && (
            <SetupWizard onComplete={handleSetupComplete} />
          )}
          {mode === "profile-select" && config && (
            <ProfileSelector
              profiles={config.profiles}
              onSelect={handleProfileSelect}
              onAddNew={() => setMode("profile-form")}
            />
          )}
          {mode === "profile-form" && (
            <ProfileForm
              onSave={handleAddProfile}
              onCancel={() => setMode("profile-select")}
            />
          )}
          {mode === "connecting" && (
            <Spinner label={`${activeProfile?.name} に接続中...`} />
          )}
        </Box>
      )}

      {/* メイン画面: 上部エディタ / 下部結果の分割表示 */}
      {isMainMode && (
        <Box flexDirection="column">
          {/* 上部: SQL エディタ */}
          <Box height={editorRows}>
            <SqlEditor
              onExecute={handleExecute}
              onSwitchProfile={handleSwitchProfile}
              onFocusResult={queryResult ? () => setMode("results") : undefined}
              initialValue={lastSql}
              visibleRows={editorRows - 4}
              isActive={mode === "editor"}
            />
          </Box>

          {/* 下部: 結果エリア */}
          <Box height={bottomRows} flexDirection="column">
            {mode === "loading" && (
              <Box flexGrow={1} alignItems="center" justifyContent="center">
                <Spinner label="クエリを実行中..." />
              </Box>
            )}
            {mode === "editor" && !queryResult && (
              <Box flexGrow={1} alignItems="center" justifyContent="center">
                <Text color="gray" dimColor>Ctrl+X でクエリを実行</Text>
              </Box>
            )}
            {mode === "editor" && queryResult && (
              <ResultView
                result={queryResult}
                onBack={() => {}}
                onSwitchProfile={handleSwitchProfile}
                visibleRows={resultVisibleRows}
                isActive={false}
              />
            )}
            {mode === "results" && queryResult && (
              <ResultView
                result={queryResult}
                onBack={() => setMode("editor")}
                onSwitchProfile={handleSwitchProfile}
                visibleRows={resultVisibleRows}
                isActive={true}
              />
            )}
            {/* editor モードでも結果がある場合は表示（フォーカスなし） */}
            {mode === "error" && error && (
              <ErrorDisplay
                error={error}
                onBack={() => setMode("editor")}
              />
            )}
          </Box>
        </Box>
      )}

      <StatusBar
        profile={activeProfile}
        mode={mode}
        rowCount={queryResult?.rowCount}
        duration={queryResult?.duration}
      />
    </Box>
  );
}

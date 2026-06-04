import os from "os";
import path from "path";
import { type Config, type Profile, isConfig } from "../types/config";

export const CONFIG_DIR = path.join(os.homedir(), ".config", "davy-sql");
export const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export async function loadConfig(): Promise<Config | null> {
  const file = Bun.file(CONFIG_PATH);
  if (!(await file.exists())) return null;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!isConfig(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await Bun.$`mkdir -p ${CONFIG_DIR}`.quiet();
  await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function buildConnectionString(profile: Profile): string {
  const encodedPass = encodeURIComponent(profile.password);
  const encodedUser = encodeURIComponent(profile.username);
  return `postgres://${encodedUser}:${encodedPass}@${profile.host}:${profile.port}/${profile.database}`;
}

import { SQL } from "bun";
import type { Profile } from "../types/config";
import { buildConnectionString, getProfilePassword } from "./config";

// 接続のキャッシュキー。プロファイル名は可変（同じ名前で別のサーバーに
// 保存し直せる）なので、認証済みの接続を取り違えないよう、資格情報の取得に
// 使う id と接続先を決定するフィールドだけでキャッシュを引く。
export function connectionKey(profile: Profile): string {
  return JSON.stringify([
    profile.id,
    profile.host,
    profile.port,
    profile.database,
    profile.username,
    profile.ssl,
  ]);
}

class ConnectionManager {
  private connections = new Map<string, SQL>();

  async connect(profile: Profile): Promise<SQL> {
    const key = connectionKey(profile);
    const existing = this.connections.get(key);
    if (existing) return existing;

    const password = await getProfilePassword(profile.id);
    const sql = new SQL({
      url: buildConnectionString(profile, password),
      tls: profile.ssl ? {} : undefined,
    });
    this.connections.set(key, sql);
    return sql;
  }

  async disconnect(profile: Profile): Promise<void> {
    const key = connectionKey(profile);
    const sql = this.connections.get(key);
    if (sql) {
      await sql.close();
      this.connections.delete(key);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [key, sql] of this.connections) {
      await sql.close();
      this.connections.delete(key);
    }
  }
}

export const connectionManager = new ConnectionManager();

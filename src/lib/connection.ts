import { SQL } from "bun";
import type { Profile } from "../types/config";
import { buildConnectionString } from "./config";

class ConnectionManager {
  private connections = new Map<string, SQL>();

  connect(profile: Profile): SQL {
    const existing = this.connections.get(profile.name);
    if (existing) return existing;

    const sql = new SQL({
      url: buildConnectionString(profile),
      tls: profile.ssl ? {} : undefined,
    });
    this.connections.set(profile.name, sql);
    return sql;
  }

  async disconnect(profileName: string): Promise<void> {
    const sql = this.connections.get(profileName);
    if (sql) {
      await sql.close();
      this.connections.delete(profileName);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [name] of this.connections) {
      await this.disconnect(name);
    }
  }
}

export const connectionManager = new ConnectionManager();

import { describe, expect, mock, test } from "bun:test";
import type { Profile } from "../types/config";
import { connectionKey } from "./connection";

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "id-a",
    name: "prod",
    host: "prod.example.com",
    port: 5432,
    database: "app",
    username: "app_user",
    ssl: true,
    savePassword: true,
    ...overrides,
  };
}

describe("connectionKey", () => {
  test("is stable for the same profile", () => {
    const p = profile();
    expect(connectionKey(p)).toBe(connectionKey(profile()));
  });

  test("ignores the mutable display name", () => {
    const a = profile({ name: "prod" });
    const b = profile({ name: "renamed-but-same-server" });
    expect(connectionKey(a)).toBe(connectionKey(b));
  });

  // This is the exploit scenario from F1: the UI's only "edit" path is
  // save-under-the-same-name with a fresh id and a different endpoint.
  // The cache key must NOT collide in that case.
  test("differs when the same name now points at a different server", () => {
    const prodByName = profile({ id: "id-a", name: "prod", host: "prod.example.com" });
    const localReusingName = profile({ id: "id-b", name: "prod", host: "localhost", database: "devdb", username: "dev_user", ssl: false });
    expect(connectionKey(prodByName)).not.toBe(connectionKey(localReusingName));
  });

  test.each([
    ["id", { id: "different-id" }],
    ["host", { host: "other.example.com" }],
    ["port", { port: 5433 }],
    ["database", { database: "other_db" }],
    ["username", { username: "other_user" }],
    ["ssl", { ssl: false }],
  ] as const)("differs when %s changes", (_field, override) => {
    const base = profile();
    const changed = profile(override);
    expect(connectionKey(base)).not.toBe(connectionKey(changed));
  });
});

describe("ConnectionManager", () => {
  async function freshManager() {
    mock.module("./config", () => ({
      getProfilePassword: async () => "secret",
      buildConnectionString: (p: Profile) => `postgres://${p.username}@${p.host}:${p.port}/${p.database}`,
    }));
    // Re-import after mocking so the module picks up the mocked dependency,
    // and use a unique query string so each test gets an isolated module
    // instance instead of a cached ConnectionManager singleton.
    const mod = await import(`./connection?t=${Math.random()}`);
    return mod.connectionManager as typeof import("./connection").connectionManager;
  }

  test("reuses the cached handle for the same profile identity", async () => {
    const manager = await freshManager();
    const p = profile();
    const first = await manager.connect(p);
    const second = await manager.connect(profile());
    expect(second).toBe(first);
  });

  // The bug this patch closes: reconnecting under a reused name used to
  // return the previous server's authenticated handle instead of opening
  // a connection to the new endpoint.
  test("does not reuse another server's handle when a name is reused for a different endpoint", async () => {
    const manager = await freshManager();
    const prod = profile({ id: "id-a", name: "shared-name", host: "prod.example.com" });
    const localDev = profile({ id: "id-b", name: "shared-name", host: "localhost", database: "devdb" });

    const prodHandle = await manager.connect(prod);
    const devHandle = await manager.connect(localDev);

    expect(devHandle).not.toBe(prodHandle);
  });

  test("disconnect evicts only the matching profile's handle", async () => {
    const manager = await freshManager();
    const a = profile({ id: "id-a", name: "a", host: "a.example.com" });
    const b = profile({ id: "id-b", name: "b", host: "b.example.com" });

    const handleA = await manager.connect(a);
    const handleB = await manager.connect(b);
    await manager.disconnect(a);

    const reconnectedA = await manager.connect(a);
    const reconnectedB = await manager.connect(b);

    expect(reconnectedA).not.toBe(handleA);
    expect(reconnectedB).toBe(handleB);
  });
});

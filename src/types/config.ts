export interface Profile {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl: boolean;
}

export interface Config {
  version: 1;
  activeProfile: string;
  profiles: Profile[];
}

export function isProfile(p: unknown): p is Profile {
  if (typeof p !== "object" || p === null) return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.host === "string" &&
    typeof obj.port === "number" &&
    typeof obj.database === "string" &&
    typeof obj.username === "string" &&
    typeof obj.ssl === "boolean"
  );
}

export function isConfig(c: unknown): c is Config {
  if (typeof c !== "object" || c === null) return false;
  const obj = c as Record<string, unknown>;
  return (
    obj.version === 1 &&
    typeof obj.activeProfile === "string" &&
    Array.isArray(obj.profiles) &&
    obj.profiles.every(isProfile)
  );
}

export function defaultProfile(): Profile {
  return {
    id: Bun.randomUUIDv7(),
    name: "",
    host: "localhost",
    port: 5432,
    database: "",
    username: "postgres",
    ssl: false,
  };
}

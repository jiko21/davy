import { describe, expect, test } from "bun:test";
import { newTab, tabProfileSwitchPatch } from "./query";
import type { QueryResult, Tab } from "./query";

function fakeResult(): QueryResult {
  return { columns: ["id"], rows: [{ id: 1 }], duration: 5, rowCount: 1, sql: "select 1" };
}

function tabWithResult(profileName: string): Tab {
  return {
    ...newTab(1, profileName),
    result: fakeResult(),
    mode: "results",
    focus: "result",
  };
}

describe("tabProfileSwitchPatch", () => {
  // F2: switching a tab to a different profile used to leave the previous
  // profile's result on screen (and copyable) under the new profile's name.
  test("discards the previous profile's result, error and focus when the profile changes", () => {
    const patch = tabProfileSwitchPatch("prod", "staging");
    expect(patch).toEqual({
      profileName: "staging",
      mode: "editor",
      result: null,
      error: null,
      focus: "editor",
    });
  });

  test("applying the patch to a tab clears stale result state", () => {
    const tab = tabWithResult("prod");
    const patched: Tab = { ...tab, ...tabProfileSwitchPatch(tab.profileName, "staging") };
    expect(patched.result).toBeNull();
    expect(patched.error).toBeNull();
    expect(patched.focus).toBe("editor");
    expect(patched.profileName).toBe("staging");
  });

  test("re-selecting the same profile leaves an in-flight result untouched", () => {
    const tab = tabWithResult("prod");
    const patched: Tab = { ...tab, ...tabProfileSwitchPatch(tab.profileName, "prod") };
    expect(patched.result).toBe(tab.result);
    expect(patched.focus).toBe("result");
    expect(patched).toEqual({ ...tab, profileName: "prod", mode: "editor" });
  });
});

export async function copyToClipboard(text: string): Promise<void> {
  const platform = process.platform;

  let cmd: string[];
  if (platform === "darwin") {
    cmd = ["pbcopy"];
  } else if (platform === "win32") {
    cmd = ["clip"];
  } else {
    // Linux: xclip を優先、なければ xsel
    const hasXclip = await Bun.$`which xclip`.quiet().then(() => true).catch(() => false);
    cmd = hasXclip ? ["xclip", "-selection", "clipboard"] : ["xsel", "--clipboard", "--input"];
  }

  const proc = Bun.spawn(cmd, { stdin: "pipe" });
  proc.stdin.write(text);
  proc.stdin.end();
  await proc.exited;
}

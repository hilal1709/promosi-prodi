import { spawnSync } from "node:child_process";

if (process.stdin.isTTY && process.stdin.setRawMode) process.stdin.setRawMode(true);
process.stdin.setEncoding("utf8");
process.stdout.write("Ready for credential JSON on stdin (input is hidden).\n");

let input = "";
process.stdin.on("data", (chunk) => {
  input += chunk;
  if (!input.includes("\n") && !input.includes("\r")) return;
  try {
    const payload = JSON.parse(input.trim());
    const result = spawnSync(
      "C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe",
      ["-C", "D:/sisfor-pilih-jalurmu/.sites-runtime/site-checkout", "push", "-u", "origin", "HEAD:main"],
      {
        env: {
          ...process.env,
          GIT_CONFIG_COUNT: "2",
          GIT_CONFIG_KEY_0: "http.extraHeader",
          GIT_CONFIG_VALUE_0: `Authorization: Bearer ${payload.token}`,
          GIT_CONFIG_KEY_1: "safe.directory",
          GIT_CONFIG_VALUE_1: "D:/sisfor-pilih-jalurmu/.sites-runtime/site-checkout",
        },
        encoding: "utf8",
      }
    );
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
});

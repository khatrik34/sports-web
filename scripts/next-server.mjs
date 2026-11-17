// Keep the public site off the admin app's port while respecting deployment PORT.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const [mode, ...args] = process.argv.slice(2);
if (mode !== "dev" && mode !== "start") {
  throw new Error("Expected dev or start");
}

const child = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), mode, "-H", "0.0.0.0", ...args],
  { stdio: "inherit", env: { ...process.env, PORT: process.env.PORT || "3001" } },
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});

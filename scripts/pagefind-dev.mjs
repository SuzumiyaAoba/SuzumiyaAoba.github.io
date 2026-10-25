import { cpSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const force = process.argv.includes("--force");
const target = path.join(process.cwd(), "out", "pagefind");

if (!force && existsSync(target)) {
  console.log(
    "[pagefind:dev] out/pagefind already exists — skipping build. Use 'npm run pagefind:dev:force' to rebuild."
  );
  cpSync(target, "public/pagefind", { recursive: true });
  process.exit(0);
}

const steps = [
  ["npm", ["run", "-s", "build:astro"]],
  ["npm", ["run", "-s", "build:pagefind"]],
];

for (const [cmd, args] of steps) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

cpSync(target, "public/pagefind", { recursive: true });

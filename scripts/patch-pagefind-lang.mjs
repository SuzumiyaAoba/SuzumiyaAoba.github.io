import fs from "node:fs/promises";

const targets = [
  ".next/server/app/_not-found.html",
  ".next/server/app/_global-error.html",
];

async function patchFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    if (!raw.includes("<html") || /\blang=/.test(raw)) {
      return;
    }
    const patched = raw.replace(
      /<html(?![^>]*\blang=)([^>]*)>/,
      '<html$1 lang="ja">',
    );
    if (patched !== raw) {
      await fs.writeFile(filePath, patched, "utf8");
    }
  } catch {
    // ignore missing files
  }
}

await Promise.all(targets.map((target) => patchFile(target)));

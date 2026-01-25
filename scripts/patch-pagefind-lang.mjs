import fs from "node:fs/promises";

const targets = [
  "out/404.html",
  "out/404/index.html",
  "out/_not-found/index.html",
  "out/500.html",
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

const googleVerificationPath = "out/google19f820ba5c9c10b8.html";
try {
  const raw = await fs.readFile(googleVerificationPath, "utf8");
  if (!raw.includes("<html")) {
    const token = raw.trim();
    const wrapped = `<!doctype html><html lang="ja"><head><meta charset="utf-8"></head><body>${token}</body></html>`;
    await fs.writeFile(googleVerificationPath, wrapped, "utf8");
  }
} catch {
  // ignore missing file
}

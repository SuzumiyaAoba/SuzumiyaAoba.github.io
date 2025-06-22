import fs from "fs";
import path from "path";

const COMPONENTS_DIR = path.join(process.cwd(), "src", "components");
const STORY_GLOB = /.stories.tsx$/;

function capitalize(word) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function normalizeSegment(seg) {
  // keep casing for acronyms (UI, SVG etc.)
  if (seg.toUpperCase() === seg) return seg;
  return capitalize(seg);
}

function computeTitle(storyPath) {
  const relativeDir = path.dirname(path.relative(COMPONENTS_DIR, storyPath));
  const dirParts = relativeDir === "" || relativeDir === "." ? [] : relativeDir.split(path.sep);
  const parsed = path.parse(storyPath);
  let baseName = parsed.name;
  if (baseName.endsWith(".stories")) baseName = baseName.replace(/\.stories$/, "");
  const componentName = baseName === "index" ? path.basename(parsed.dir) : baseName;
  const parts = dirParts.map(normalizeSegment).filter(Boolean);
  parts.push(componentName);
  return `Components/${parts.join("/")}`;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const newTitle = computeTitle(filePath);
  const titleRegex = /title:\s*"([^"]*)"/;
  if (!titleRegex.test(content)) {
    console.warn(`No title found in ${filePath}`);
    return;
  }
  const currentTitle = content.match(titleRegex)[1];
  if (currentTitle === newTitle) return; // already correct
  const updated = content.replace(titleRegex, `title: "${newTitle}"`);
  fs.writeFileSync(filePath, updated, "utf-8");
  console.log(`Updated title in ${filePath} -> ${newTitle}`);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && STORY_GLOB.test(entry.name)) {
      processFile(fullPath);
    }
  });
}

walk(COMPONENTS_DIR); 
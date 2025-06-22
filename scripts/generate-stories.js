import fs from "fs";
import path from "path";

const COMPONENTS_DIR = path.join(process.cwd(), "src", "components");

/** Recursively walk through a directory and return all .tsx files that are not test or story files */
function getComponentFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Ignore __tests__ directories
      if (entry.name === "__tests__") return [];
      return getComponentFiles(fullPath);
    }

    if (
      entry.isFile() &&
      entry.name.endsWith(".tsx") &&
      !entry.name.endsWith(".stories.tsx") &&
      !entry.name.endsWith(".test.tsx") &&
      !entry.name.includes("-") // skip files with hyphen in name to avoid invalid identifiers or non-React exports
    ) {
      return [fullPath];
    }

    return [];
  });
}

/** Create a story file for a given component path if it does not exist */
function createStoryFile(componentPath) {
  const parsed = path.parse(componentPath);

  // Determine story file path: index.tsx -> index.stories.tsx, otherwise Component.stories.tsx
  const storyFileName = `${parsed.name}.stories.tsx`;
  const storyFilePath = path.join(parsed.dir, storyFileName);

  if (fs.existsSync(storyFilePath)) {
    console.log(`✅ Story already exists for ${componentPath}`);
    return;
  }

  // Determine import path relative within same directory
  const importPath = `./${parsed.name}`;
  const componentName = parsed.name === "index" ? path.basename(parsed.dir) : parsed.name;

  const template = `import type { Meta, StoryObj } from "@storybook/react";
import { ${componentName} } from "${importPath}";

export default {
  title: "Components/${componentName}",
  component: ${componentName},
} satisfies Meta<typeof ${componentName}>;

type Story = StoryObj<typeof ${componentName}>;

export const Default: Story = {
  args: {},
};
`;

  fs.writeFileSync(storyFilePath, template, "utf-8");
  console.log(`📝 Created story: ${storyFilePath}`);
}

function main() {
  const componentFiles = getComponentFiles(COMPONENTS_DIR);

  componentFiles.forEach(createStoryFile);
}

main(); 
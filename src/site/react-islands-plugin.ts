import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { Plugin } from "vite";

const CLIENT_DIRECTIVE = /^\s*["']use client["'];/u;
const COMPONENT_NAME = /^[A-Z][a-zA-Z0-9]*$/u;

function clientFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return clientFiles(filename);
    }
    if (
      !filename.endsWith(".tsx") ||
      /\.(test|stories)\./u.test(filename) ||
      filename.includes("/shared/ui/providers/")
    ) {
      return [];
    }
    return CLIENT_DIRECTIVE.test(fs.readFileSync(filename, "utf-8"))
      ? [filename]
      : [];
  });
}

export function reactIslands(): Plugin {
  let root = process.cwd();
  return {
    name: "react-component-islands",
    enforce: "pre",
    configResolved(config) {
      ({ root } = config);
    },
    resolveId(id) {
      return id === "virtual:react-islands" ? "\0react-islands" : null;
    },
    load(id) {
      if (id !== "\0react-islands") {
        return null;
      }
      return `export const modules = {${clientFiles(path.join(root, "src"))
        .map((file) => {
          const modulePath = `/${path.relative(root, file)}`;
          return `${JSON.stringify(modulePath)}: () => import(${JSON.stringify(modulePath)})`;
        })
        .join(",")}};`;
    },
    transform(source, id, options) {
      if (
        !options?.ssr ||
        !id.endsWith(".tsx") ||
        id.includes("/shared/ui/providers/") ||
        !CLIENT_DIRECTIVE.test(source)
      ) {
        return null;
      }
      const file = ts.createSourceFile(
        id,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );
      const names: string[] = [];
      const edits: [number, number][] = [];
      for (const statement of file.statements) {
        if (
          !ts.isFunctionDeclaration(statement) &&
          !ts.isVariableStatement(statement) &&
          !ts.isClassDeclaration(statement)
        ) {
          continue;
        }
        const exported = statement.modifiers?.find(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
        );
        if (!exported) {
          continue;
        }
        const declarations = ts.isVariableStatement(statement)
          ? statement.declarationList.declarations
          : [statement];
        const components = declarations.filter(
          (declaration) =>
            declaration.name &&
            ts.isIdentifier(declaration.name) &&
            COMPONENT_NAME.test(declaration.name.text)
        );
        if (!components.length) {
          continue;
        }
        edits.push([exported.getStart(file), exported.end]);
        for (const declaration of components) {
          if (declaration.name && ts.isIdentifier(declaration.name)) {
            names.push(declaration.name.text);
          }
        }
      }
      if (!names.length) {
        return null;
      }
      let code = source;
      for (const [start, end] of edits.toReversed()) {
        code = code.slice(0, start) + code.slice(end);
      }
      const moduleId = `/${path.relative(root, id)}`;
      code +=
        '\nimport { createIsland as __createIsland } from "@/shared/lib/presentation/islands/server";\n';
      for (const name of names) {
        code += `const __island_${name} = __createIsland(${name}, ${JSON.stringify(moduleId)}, ${JSON.stringify(name)}); export { __island_${name} as ${name} };\n`;
      }
      return { code, map: null };
    },
  };
}

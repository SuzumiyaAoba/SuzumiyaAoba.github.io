import fs from "fs";
import path from "path";

/**
 * MDX コンテンツから JSON インポートを抽出し、ロードする
 */
export interface MdxImportResult {
  /** インポートを除去した後のコンテンツ */
  content: string;
  /** ロードされたインポートデータ（変数名 -> データ） */
  imports: Record<string, unknown>;
}

/**
 * MDX コンテンツから相対パスの JSON インポートを解析し、データをロードする
 *
 * @param content MDX コンテンツ
 * @param basePath MDX ファイルのディレクトリパス
 * @returns インポートを除去したコンテンツとロードされたデータ
 */
export function extractAndLoadJsonImports(
  content: string,
  basePath: string
): MdxImportResult {
  const imports: Record<string, unknown> = {};

  // 相対パスの JSON インポートにマッチする正規表現
  // import varName from "./path/to/file.json";
  // import { named } from "./path/to/file.json";
  const importRegex =
    /^import\s+(?:(\w+)|{\s*(\w+)\s*})\s+from\s+["'](\.[^"']+\.json)["'];?\s*$/gm;

  const processedContent = content.replace(
    importRegex,
    (match, defaultImport, namedImport, importPath) => {
      const varName = defaultImport || namedImport;
      const absolutePath = path.resolve(basePath, importPath);

      try {
        if (fs.existsSync(absolutePath)) {
          const jsonContent = fs.readFileSync(absolutePath, "utf-8");
          const data = JSON.parse(jsonContent);

          // named import の場合は直接、default import の場合もそのまま
          imports[varName] = data;

          // インポート文を削除（空行に置換）
          return "";
        } else {
          console.warn(`JSON file not found: ${absolutePath}`);
          return match; // ファイルが見つからない場合はそのまま
        }
      } catch (error) {
        console.error(`Failed to load JSON: ${absolutePath}`, error);
        return match; // エラーの場合はそのまま
      }
    }
  );

  return {
    content: processedContent,
    imports,
  };
}

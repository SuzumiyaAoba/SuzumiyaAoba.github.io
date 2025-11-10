import path from "node:path";
import fs from "node:fs/promises";
import { seriesDefinitionSchema, type SeriesDefinition } from "./schema";

/**
 * シリーズ定義ディレクトリから全てのJSONファイルを読み込む
 */
export async function loadSeriesDefinitions(): Promise<SeriesDefinition[]> {
  const seriesDir = path.join(process.cwd(), "src/contents/series");

  try {
    const files = await fs.readdir(seriesDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const definitions = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(seriesDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        const json = JSON.parse(content);
        return seriesDefinitionSchema.parse(json);
      }),
    );

    return definitions;
  } catch (error) {
    console.error("Failed to load series definitions:", error);
    return [];
  }
}

import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";
import { createSheetDataReader } from "./parse-sheet-data";

export const getAssetSheet = createSheetDataReader(assetsData);

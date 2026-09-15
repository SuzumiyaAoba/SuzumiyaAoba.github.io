import { SheetDataSchema } from "@/shared/ui/financial-charts";
import type { SheetData } from "@/shared/ui/financial-charts";

type AssetsDataWithSheets = { sheets: Record<string, unknown> };

/** assetsData.sheets[sheetKey] を SheetDataSchema でパースする(失敗時は null) */
export function parseSheetData(
  assetsData: AssetsDataWithSheets,
  sheetKey: string
): SheetData | null {
  const result = SheetDataSchema.safeParse(assetsData.sheets[sheetKey]);
  return result.success ? result.data : null;
}

/** 静的なデータセット用。必要になったシートだけを解析し、同じ参照を各グラフに渡す。 */
export function createSheetDataReader(assetsData: AssetsDataWithSheets) {
  const parsedSheets = new Map<string, SheetData | null>();

  return (sheetKey: string): SheetData | null => {
    if (!parsedSheets.has(sheetKey)) {
      parsedSheets.set(sheetKey, parseSheetData(assetsData, sheetKey));
    }
    return parsedSheets.get(sheetKey) ?? null;
  };
}

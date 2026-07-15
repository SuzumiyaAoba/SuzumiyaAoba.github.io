import { SheetDataSchema, type SheetData } from "@/shared/ui/financial-charts";

type AssetsDataWithSheets = { sheets: Record<string, unknown> };

/** assetsData.sheets[sheetKey] を SheetDataSchema でパースする(失敗時は null) */
export function parseSheetData(
  assetsData: AssetsDataWithSheets,
  sheetKey: string,
): SheetData | null {
  const result = SheetDataSchema.safeParse(assetsData.sheets[sheetKey]);
  return result.success ? result.data : null;
}

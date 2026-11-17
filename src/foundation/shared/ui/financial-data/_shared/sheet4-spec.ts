import type { AssetSheetSpec } from "./asset-sheet-charts";
import {
  SHEET4_EXCLUDE_HEADERS,
  SHEET4_LABEL_MAP,
} from "./sheet4-asset-labels";

export const SHEET4_SPEC: AssetSheetSpec = {
  sheetId: "4",
  excludeHeaders: SHEET4_EXCLUDE_HEADERS,
  labelMap: SHEET4_LABEL_MAP,
  startYear: 2004,
};

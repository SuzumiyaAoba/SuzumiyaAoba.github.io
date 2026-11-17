import type { AssetSheetSpec } from "./asset-sheet-charts";
import {
  SHEET3_EXCLUDE_HEADERS,
  SHEET3_LABEL_MAP,
} from "./sheet3-asset-labels";

export const SHEET3_SPEC: AssetSheetSpec = {
  sheetId: "3",
  excludeHeaders: SHEET3_EXCLUDE_HEADERS,
  labelMap: SHEET3_LABEL_MAP,
  startYear: 1963,
};

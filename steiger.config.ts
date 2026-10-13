import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  // oxlint-disable-next-line typescript/no-unsafe-assignment -- Steiger の公開型が未公開の @steiger/toolkit を参照する。
  ...fsd.configs.recommended,
  {
    // 検査対象外の src/app でもメタデータ・静的ルート・サイトマップに共有する。
    files: ["./src/foundation/entities/note/**"],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
]);

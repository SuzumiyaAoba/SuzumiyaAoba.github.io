import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

// oxlint-disable-next-line typescript/no-unsafe-assignment -- Steiger の公開型が未公開の @steiger/toolkit を参照する。
export default defineConfig([...fsd.configs.recommended]);

import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  presetWebFonts,
  presetWind,
} from "unocss";

export default defineConfig({
  content: {
    filesystem: ["**/*.{html,js,ts,jsx,tsx}"],
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
    presetWebFonts(),
    presetWind(),
  ],
});

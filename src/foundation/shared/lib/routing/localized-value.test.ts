import { describe, expect, it } from "vite-plus/test";
import { resolveLocalizedValue } from "./localized-value";

describe("resolveLocalizedValue", () => {
  it("指定された言語を優先する", () => {
    const values = { ja: "日本語", en: "English" };
    expect(resolveLocalizedValue(values, "ja")).toBe("日本語");
    expect(resolveLocalizedValue(values, "en")).toBe("English");
  });

  it("欠けている言語をもう一方で補い、両方なければnullを返す", () => {
    expect(resolveLocalizedValue({ ja: null, en: "English" }, "ja")).toBe(
      "English"
    );
    expect(resolveLocalizedValue({ ja: "日本語", en: null }, "en")).toBe(
      "日本語"
    );
    expect(resolveLocalizedValue({ ja: null, en: null }, "en")).toBeNull();
  });

  it("空文字やfalseは欠落として扱わない", () => {
    expect(resolveLocalizedValue({ ja: "", en: "English" }, "ja")).toBe("");
    expect(resolveLocalizedValue({ ja: false, en: true }, "ja")).toBe(false);
  });
});

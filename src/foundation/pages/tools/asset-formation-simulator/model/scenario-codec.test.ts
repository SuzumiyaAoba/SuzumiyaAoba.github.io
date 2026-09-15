import { compressToEncodedURIComponent } from "lz-string";
import { describe, expect, it } from "vite-plus/test";
import {
  decodeScenarios,
  decodeVisibilityPayload,
  encodeScenarios,
  encodeVisibilityPayload,
  isSameScenarios,
} from "./scenario-codec";
import type { ScenarioInput } from "./types";

const scenarios: ScenarioInput[] = [
  {
    id: "scenario-1",
    name: "パターン1",
    monthlyContributionInput: "30000",
    annualRateInput: "5",
  },
];

// 分割前の実装で生成した共有URLのパラメーター。
const legacyScenarios =
  "NobwRAlgJmBcYGcDGBTAdgQwE4QPYFoBGMAGjEwFsU4xBFhkH6GQH4ZBnhmLItzQBcALAGwCeAYU5ccAIwCuXPGgCSaAA7SaAZgAMm9aTAY0aSRj4AlDFxQLlXGgFYwAXwC6QA";
const legacyVisibility =
  "N4IgbglgzhBGA2BTEAuUUDGiB2BDAThAPYC0AjCrLvLtlqgC74CuiANCJjgceSgA6E6EftVQAzalHacseQqQoBzXBGyMWMrvN7LV2ACIRx4iVMQBfDhiLwi+KKnRyei1CADEZAEwBmACwArABsIBYWQA";

function encode(value: unknown) {
  return compressToEncodedURIComponent(JSON.stringify(value));
}

describe("scenario codec", () => {
  it("既存の共有URLを読み込み、同じパラメーターを生成する", () => {
    expect(decodeScenarios(legacyScenarios)).toStrictEqual(scenarios);
    expect(encodeScenarios(scenarios)).toBe(legacyScenarios);
  });

  it("日本語の名前、入力途中の空欄、負の利回りを保持する", () => {
    const inputs: ScenarioInput[] = [
      {
        id: "custom",
        name: "積立 🪙 / Plan",
        monthlyContributionInput: "",
        annualRateInput: "-2.5",
      },
      {
        id: "second",
        name: "Second",
        monthlyContributionInput: "10000",
        annualRateInput: "",
      },
    ];

    expect(decodeScenarios(encodeScenarios(inputs))).toStrictEqual(inputs);
  });

  it("必須入力を持つ項目だけを復元し、IDと名前を補完する", () => {
    expect(
      decodeScenarios(
        encode([
          null,
          { monthlyContributionInput: 1000, annualRateInput: "5" },
          { monthlyContributionInput: "2000", annualRateInput: "3" },
        ])
      )
    ).toStrictEqual([
      {
        id: "scenario-3",
        name: "パターン3",
        monthlyContributionInput: "2000",
        annualRateInput: "3",
      },
    ]);
  });

  it.each([
    "",
    "invalid",
    encode(null),
    encode({}),
    encode([]),
    compressToEncodedURIComponent("{"),
  ])("復元できないパラメーター %s を無視する", (value) => {
    expect(decodeScenarios(value)).toBeNull();
  });

  it("既定値で補完したシナリオは同一と判定し、入力値の差は区別する", () => {
    const unnamed: ScenarioInput[] = [
      {
        id: "",
        name: "",
        monthlyContributionInput: "30000",
        annualRateInput: "5",
      },
    ];
    const changed: ScenarioInput[] = [
      {
        id: "scenario-1",
        name: "パターン1",
        monthlyContributionInput: "30000",
        annualRateInput: "6",
      },
    ];

    expect(isSameScenarios(unnamed, scenarios)).toBe(true);
    expect(encodeScenarios(unnamed)).toBe(legacyScenarios);
    expect(isSameScenarios(scenarios, changed)).toBe(false);
  });
});

describe("visibility codec", () => {
  const visible = {
    "scenario-1:balance": true,
    "scenario-1:principal": false,
    "scenario-1:gain": true,
    "scenario-1:gainDiff": false,
  };
  const colors = { "scenario-1": "#123456" };

  it("既存URLの表示設定と色を復元し、同じパラメーターを生成する", () => {
    expect(decodeVisibilityPayload(legacyVisibility, scenarios)).toStrictEqual({
      visible,
      colors,
    });
    expect(encodeVisibilityPayload(visible, colors, scenarios)).toBe(
      legacyVisibility
    );
  });

  it("不明な系列、削除済みのパターン、不正な型を復元しない", () => {
    const payload = encode({
      visible: {
        "scenario-1:balance": false,
        "scenario-1:gain": "true",
        "scenario-1:unknown": true,
        "removed:principal": true,
      },
      colors: { "scenario-1": 42, removed: "#123456" },
    });

    expect(decodeVisibilityPayload(payload, scenarios)).toStrictEqual({
      visible: { "scenario-1:balance": false },
      colors: {},
    });
  });

  it("書き出し時に削除済みパターンの表示設定と色を除外する", () => {
    expect(
      encodeVisibilityPayload(
        { ...visible, "removed:balance": true },
        { ...colors, removed: "#ffffff" },
        scenarios
      )
    ).toBe(legacyVisibility);
  });

  it("省略された設定は空の状態として復元する", () => {
    expect(decodeVisibilityPayload(encode({}), scenarios)).toStrictEqual({
      visible: {},
      colors: {},
    });
    expect(
      decodeVisibilityPayload(
        encode({ colors: { "scenario-1": "red" } }),
        scenarios
      )
    ).toStrictEqual({
      visible: {},
      colors: {},
    });
  });

  it.each(["", "invalid", encode(null), compressToEncodedURIComponent("{")])(
    "復元できない表示設定 %s を無視する",
    (value) => {
      expect(decodeVisibilityPayload(value, scenarios)).toBeNull();
    }
  );
});

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { isRecord } from "@/shared/lib/types";
import type { ColorState, ScenarioInput, VisibleState } from "./types";

const normalizeScenarioList = (list: ScenarioInput[]) =>
  list.map((item, index) => ({
    id: item.id || `scenario-${index + 1}`,
    name: item.name || `パターン${index + 1}`,
    monthlyContributionInput: item.monthlyContributionInput,
    annualRateInput: item.annualRateInput,
  }));

const normalizeVisibleState = (
  value: unknown,
  scenarioList: ScenarioInput[]
): VisibleState => {
  if (!isRecord(value)) {
    return {};
  }
  const raw = value;
  const next: VisibleState = {};
  for (const scenario of scenarioList) {
    const baseKey = scenario.id;
    const keys = ["balance", "principal", "gain", "gainDiff"];
    for (const suffix of keys) {
      const key = `${baseKey}:${suffix}`;
      const rawValue = raw[key];
      if (typeof rawValue === "boolean") {
        next[key] = rawValue;
      }
    }
  }
  return next;
};

const normalizeColorState = (
  value: unknown,
  scenarioList: ScenarioInput[]
): ColorState => {
  if (!isRecord(value)) {
    return {};
  }
  const raw = value;
  const next: ColorState = {};
  for (const scenario of scenarioList) {
    const rawValue = raw[scenario.id];
    if (typeof rawValue === "string" && rawValue.startsWith("#")) {
      next[scenario.id] = rawValue;
    }
  }
  return next;
};

export const encodeVisibilityPayload = (
  visible: VisibleState,
  colors: ColorState,
  scenarioList: ScenarioInput[]
) => {
  const normalizedVisible = normalizeVisibleState(visible, scenarioList);
  const normalizedColors = normalizeColorState(colors, scenarioList);
  return compressToEncodedURIComponent(
    JSON.stringify({
      visible: normalizedVisible,
      colors: normalizedColors,
    })
  );
};

export const decodeVisibilityPayload = (
  value: string,
  scenarioList: ScenarioInput[]
): { visible: VisibleState; colors: ColorState } | null => {
  const json = decompressFromEncodedURIComponent(value);
  if (!json) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) {
      return null;
    }
    return {
      visible: normalizeVisibleState(parsed["visible"], scenarioList),
      colors: normalizeColorState(parsed["colors"], scenarioList),
    };
  } catch {
    return null;
  }
};
const normalizeScenarios = (value: unknown): ScenarioInput[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }
      const raw = item;
      const { monthlyContributionInput } = raw;
      const { annualRateInput } = raw;
      if (
        typeof monthlyContributionInput !== "string" ||
        typeof annualRateInput !== "string"
      ) {
        return null;
      }
      const id =
        typeof raw["id"] === "string" ? raw["id"] : `scenario-${index + 1}`;
      const name =
        typeof raw["name"] === "string" ? raw["name"] : `パターン${index + 1}`;

      return {
        id,
        name,
        monthlyContributionInput,
        annualRateInput,
      };
    })
    .filter((item): item is ScenarioInput => item !== null);

  return normalized.length > 0 ? normalized : null;
};

export const encodeScenarios = (value: ScenarioInput[]) =>
  compressToEncodedURIComponent(JSON.stringify(normalizeScenarioList(value)));

export const isSameScenarios = (a: ScenarioInput[], b: ScenarioInput[]) =>
  JSON.stringify(normalizeScenarioList(a)) ===
  JSON.stringify(normalizeScenarioList(b));

export const decodeScenarios = (value: string): ScenarioInput[] | null => {
  const json = decompressFromEncodedURIComponent(value);
  if (!json) {
    return null;
  }
  try {
    return normalizeScenarios(JSON.parse(json));
  } catch {
    return null;
  }
};

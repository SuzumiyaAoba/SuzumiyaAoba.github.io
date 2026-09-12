import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { ColorState, ScenarioInput, VisibleState } from "./types";

const normalizeScenarioList = (list: ScenarioInput[]) =>
  list.map((item, index) => ({
    id: item.id || `scenario-${index + 1}`,
    name: item.name || `パターン${index + 1}`,
    monthlyContributionInput: item.monthlyContributionInput ?? "",
    annualRateInput: item.annualRateInput ?? "",
  }));

const normalizeVisibleState = (value: unknown, scenarioList: ScenarioInput[]): VisibleState => {
  if (!value || typeof value !== "object") {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const next: VisibleState = {};
  scenarioList.forEach((scenario) => {
    const baseKey = scenario.id;
    const keys = ["balance", "principal", "gain", "gainDiff"];
    keys.forEach((suffix) => {
      const key = `${baseKey}:${suffix}`;
      const rawValue = raw[key];
      if (typeof rawValue === "boolean") {
        next[key] = rawValue;
      }
    });
  });
  return next;
};

const normalizeColorState = (value: unknown, scenarioList: ScenarioInput[]): ColorState => {
  if (!value || typeof value !== "object") {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const next: ColorState = {};
  scenarioList.forEach((scenario) => {
    const rawValue = raw[scenario.id];
    if (typeof rawValue === "string" && rawValue.startsWith("#")) {
      next[scenario.id] = rawValue;
    }
  });
  return next;
};

export const encodeVisibilityPayload = (
  visible: VisibleState,
  colors: ColorState,
  scenarioList: ScenarioInput[],
) => {
  const normalizedVisible = normalizeVisibleState(visible, scenarioList);
  const normalizedColors = normalizeColorState(colors, scenarioList);
  return compressToEncodedURIComponent(
    JSON.stringify({
      visible: normalizedVisible,
      colors: normalizedColors,
    }),
  );
};

export const decodeVisibilityPayload = (
  value: string,
  scenarioList: ScenarioInput[],
): { visible: VisibleState; colors: ColorState } | null => {
  const json = decompressFromEncodedURIComponent(value);
  if (!json) {
    return null;
  }
  try {
    const parsed = JSON.parse(json) as {
      visible?: unknown;
      colors?: unknown;
    };
    return {
      visible: normalizeVisibleState(parsed.visible, scenarioList),
      colors: normalizeColorState(parsed.colors, scenarioList),
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
      if (!item || typeof item !== "object") {
        return null;
      }
      const raw = item as Record<string, unknown>;
      const monthlyContributionInput = raw["monthlyContributionInput"];
      const annualRateInput = raw["annualRateInput"];
      if (typeof monthlyContributionInput !== "string" || typeof annualRateInput !== "string") {
        return null;
      }
      const id = typeof raw["id"] === "string" ? raw["id"] : `scenario-${index + 1}`;
      const name = typeof raw["name"] === "string" ? raw["name"] : `パターン${index + 1}`;

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
  JSON.stringify(normalizeScenarioList(a)) === JSON.stringify(normalizeScenarioList(b));

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

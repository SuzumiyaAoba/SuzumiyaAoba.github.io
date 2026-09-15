"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/shared/lib/routing";
import {
  decodeScenarios,
  decodeVisibilityPayload,
  encodeScenarios,
  encodeVisibilityPayload,
  isSameScenarios,
} from "./scenario-codec";
import { calculateSchedule, toYearlyRows } from "./simulation";
import type {
  ColorState,
  ScenarioData,
  ScenarioInput,
  VisibleState,
} from "./types";

const scenarioPalette = [
  "#5B4EAD",
  "#2E8B8B",
  "#D85C3A",
  "#C2477D",
  "#C9A227",
  "#3E8E5C",
  "#C8B53C",
  "#2F7FB7",
  "#4A4F7A",
  "#C46A4A",
];

const defaultScenarios: ScenarioInput[] = [
  {
    id: "scenario-1",
    name: "パターン1",
    monthlyContributionInput: "30000",
    annualRateInput: "5",
  },
];

export function useAssetFormationSimulator(locale: Locale) {
  const [compressedParam, setCompressedParam] = useQueryState(
    "p",
    parseAsString
  );
  const [scenarios, setScenarios] = useState<ScenarioInput[]>(defaultScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState("scenario-1");
  const [yearsInput, setYearsInput] = useState("20");
  const lastEncodedRef = useRef<string | null>(null);
  const [visibleSeriesParam, setVisibleSeriesParam] = useQueryState(
    "v",
    parseAsString
  );
  const [visibleSeries, setVisibleSeries] = useState<VisibleState>({});
  const [colorOverrides, setColorOverrides] = useState<ColorState>({});

  const defaultPatternName = useCallback(
    (index: number) =>
      locale === "en" ? `Pattern ${index}` : `パターン${index}`,
    [locale]
  );

  useEffect(() => {
    setScenarios((prev) =>
      prev.map((scenario, index) => {
        const jaDefault = `パターン${index + 1}`;
        const enDefault = `Pattern ${index + 1}`;
        if (scenario.name === jaDefault || scenario.name === enDefault) {
          return { ...scenario, name: defaultPatternName(index + 1) };
        }
        return scenario;
      })
    );
  }, [defaultPatternName]);

  const scenarioList = scenarios;
  const years = Number(yearsInput) || 0;

  const syncScenarios = useCallback(
    (updater: (prev: ScenarioInput[]) => ScenarioInput[]) => {
      setScenarios((prev) => {
        const next = updater(prev);
        const encoded = encodeScenarios(next);
        lastEncodedRef.current = encoded;
        void setCompressedParam(encoded);
        return next;
      });
    },
    [setCompressedParam]
  );

  const scenarioData = useMemo<ScenarioData[]>(
    () =>
      scenarioList.map((scenario, index) => {
        const monthlyContribution =
          Number(scenario.monthlyContributionInput) || 0;
        const annualRate = Number(scenario.annualRateInput) || 0;
        const schedule = calculateSchedule(
          monthlyContribution,
          annualRate,
          years
        );
        const tableRows = toYearlyRows(schedule);

        const baseColor =
          scenarioPalette[index % scenarioPalette.length] ?? "#5B4EAD";
        const color = colorOverrides[scenario.id] ?? baseColor;

        return {
          id: scenario.id,
          monthlyContribution,
          annualRate,
          schedule,
          tableRows,
          color,
          label: scenario.name || defaultPatternName(index + 1),
        };
      }),
    [scenarioList, years, colorOverrides, defaultPatternName]
  );

  const selectedScenario =
    scenarioData.find((scenario) => scenario.id === selectedScenarioId) ??
    scenarioData[0];

  const summary = selectedScenario?.schedule.at(-1) ?? {
    principal: 0,
    gain: 0,
    balance: 0,
  };

  const tableRows = useMemo(
    () => selectedScenario?.tableRows ?? [],
    [selectedScenario]
  );

  useEffect(() => {
    setVisibleSeries((prev) => {
      const next: VisibleState = { ...prev };
      for (const scenario of scenarioList) {
        const defaults: Record<string, boolean> = {
          balance: true,
          principal: true,
          gain: false,
          gainDiff: false,
        };
        for (const [suffix, defaultValue] of Object.entries(defaults)) {
          const key = `${scenario.id}:${suffix}`;
          next[key] ??= defaultValue;
        }
      }
      return next;
    });
  }, [scenarioList]);

  useEffect(() => {
    if (!visibleSeriesParam) {
      return;
    }
    const decoded = decodeVisibilityPayload(visibleSeriesParam, scenarioList);
    if (!decoded) {
      return;
    }
    setVisibleSeries((prev) => ({ ...prev, ...decoded.visible }));
    setColorOverrides((prev) => ({ ...prev, ...decoded.colors }));
  }, [visibleSeriesParam, scenarioList]);

  useEffect(() => {
    if (Object.keys(visibleSeries).length === 0) {
      return;
    }
    const encoded = encodeVisibilityPayload(
      visibleSeries,
      colorOverrides,
      scenarioList
    );
    if (encoded !== visibleSeriesParam) {
      void setVisibleSeriesParam(encoded);
    }
  }, [
    visibleSeries,
    colorOverrides,
    scenarioList,
    visibleSeriesParam,
    setVisibleSeriesParam,
  ]);

  useEffect(() => {
    if (!compressedParam) {
      return;
    }
    if (lastEncodedRef.current) {
      if (compressedParam !== lastEncodedRef.current) {
        return;
      }
      lastEncodedRef.current = null;
      return;
    }
    const decoded = decodeScenarios(compressedParam);
    if (!decoded) {
      return;
    }
    setScenarios((prev) => (isSameScenarios(prev, decoded) ? prev : decoded));
  }, [compressedParam]);

  useEffect(() => {
    const encoded = encodeScenarios(scenarioList);
    if (compressedParam !== encoded) {
      lastEncodedRef.current = encoded;
      void setCompressedParam(encoded);
    }
  }, [scenarioList, compressedParam, setCompressedParam]);

  useEffect(() => {
    if (!selectedScenarioId && scenarioList[0]) {
      const firstScenarioId = scenarioList[0].id;
      if (firstScenarioId) {
        setSelectedScenarioId(firstScenarioId);
      }
      return;
    }
    if (
      scenarioList.length > 0 &&
      !scenarioList.some((s) => s.id === selectedScenarioId)
    ) {
      const firstScenarioId = scenarioList[0]?.id;
      if (firstScenarioId) {
        setSelectedScenarioId(firstScenarioId);
      }
    }
  }, [scenarioList, selectedScenarioId]);

  return {
    scenarioList,
    scenarioData,
    selectedScenario,
    selectedScenarioId,
    setSelectedScenarioId,
    yearsInput,
    setYearsInput,
    visibleSeries,
    setVisibleSeries,
    summary,
    tableRows,
    defaultPatternName,
    syncScenarios,
  };
}

"use client";

import type { Locale } from "@/shared/lib/routing";
import { useAssetFormationSimulator } from "../model/use-asset-formation-simulator";
import { SimulationChart } from "./simulation-chart";
import { useSimulatorFormatters } from "./use-simulator-formatters";

const inputStyle = {
  color: "var(--foreground)",
  backgroundColor: "var(--input)",
};

type AssetFormationSimulatorProps = {
  locale: Locale;
};

export default function AssetFormationSimulator({ locale }: AssetFormationSimulatorProps) {
  const { t, numberFormatter, formatYenWithMan, formatYears } = useSimulatorFormatters(locale);
  const {
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
  } = useAssetFormationSimulator(locale);

  return (
    <main className="site-main flex flex-col">
      <h1 className="mb-6 text-3xl">
        {t("資産形成シミュレーション", "Asset Formation Simulator")}
      </h1>
      <p className="mb-4 text-sm text-foreground/80">
        {t(
          "毎月末に積立て、年平均利回りは実効年利として月利へ換算し、複数パターンを同一条件で複利計算します。税金や手数料は考慮していません。",
          "Contributions are made at month-end. Annual returns are converted to monthly rates and compounded across scenarios under the same conditions. Taxes and fees are not considered.",
        )}
      </p>
      <p className="mb-2 text-xs text-foreground/70">
        {t(
          "※ 本シミュレーションは実際の値動きを反映したものではありません。",
          "※ This simulation does not reflect actual market movements.",
        )}
      </p>
      <p className="mb-2 text-xs text-foreground/70">
        {t(
          "※ 本ツールは情報提供を目的としたもので、投資助言・勧誘を意図するものではありません。最終的な投資判断はご自身の責任で行ってください。",
          "※ This tool is for informational purposes only and is not investment advice. Make decisions at your own risk.",
        )}
      </p>
      <p className="mb-6 text-xs text-foreground/70">
        {t(
          "※ 情報の正確性には配慮していますが、その完全性・最新性を保証するものではありません。",
          "※ We strive for accuracy but do not guarantee completeness or timeliness.",
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <label className="flex flex-col gap-2">
          <span className="text-sm">{t("積立て期間（年）", "Contribution period (years)")}</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            step={1}
            value={yearsInput}
            onChange={(event) => {
              setYearsInput(event.target.value);
            }}
            className="w-full p-2 border rounded-md"
            style={inputStyle}
          />
        </label>
      </div>

      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground/80">
            {t("積立てパターン", "Contribution scenarios")}
          </h2>
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => {
              syncScenarios((prev) => {
                const nextIndex = prev.length + 1;
                return [
                  ...prev,
                  {
                    id: `scenario-${nextIndex}`,
                    name: defaultPatternName(nextIndex),
                    monthlyContributionInput: "30000",
                    annualRateInput: "5",
                  },
                ];
              });
            }}
          >
            {t("パターンを追加", "Add scenario")}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarioList.map((scenario, index) => (
            <div
              key={scenario.id}
              className="border rounded-md p-4 space-y-3"
              style={{ backgroundColor: "var(--card)" }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{defaultPatternName(index + 1)}</div>
                {scenarioList.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => {
                      syncScenarios((prev) => prev.filter((item) => item.id !== scenario.id));
                    }}
                  >
                    {t("削除", "Remove")}
                  </button>
                )}
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-xs">{t("パターン名", "Scenario name")}</span>
                <input
                  type="text"
                  value={scenario.name}
                  onChange={(event) => {
                    const value = event.target.value;
                    syncScenarios((prev) =>
                      prev.map((item) =>
                        item.id === scenario.id ? { ...item, name: value } : item,
                      ),
                    );
                  }}
                  className="w-full p-2 border rounded-md"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs">
                  {t("毎月の積立て金額（円）", "Monthly contribution (JPY)")}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={scenario.monthlyContributionInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    syncScenarios((prev) =>
                      prev.map((item) =>
                        item.id === scenario.id
                          ? { ...item, monthlyContributionInput: value }
                          : item,
                      ),
                    );
                  }}
                  className="w-full p-2 border rounded-md"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs">
                  {t("年平均利回り（%）", "Average annual return (%)")}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.1}
                  value={scenario.annualRateInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    syncScenarios((prev) =>
                      prev.map((item) =>
                        item.id === scenario.id ? { ...item, annualRateInput: value } : item,
                      ),
                    );
                  }}
                  className="w-full p-2 border rounded-md"
                  style={inputStyle}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded-md" style={{ backgroundColor: "var(--card)" }}>
          <p className="text-xs text-foreground/60 mb-1">{t("元本合計", "Total principal")}</p>
          <p className="text-xl font-semibold">{formatYenWithMan(summary.principal)}</p>
        </div>
        <div className="p-4 border rounded-md" style={{ backgroundColor: "var(--card)" }}>
          <p className="text-xs text-foreground/60 mb-1">{t("運用益", "Investment gain")}</p>
          <p className="text-xl font-semibold">{formatYenWithMan(summary.gain)}</p>
        </div>
        <div className="p-4 border rounded-md" style={{ backgroundColor: "var(--card)" }}>
          <p className="text-xs text-foreground/60 mb-1">{t("評価額", "Balance")}</p>
          <p className="text-xl font-semibold">{formatYenWithMan(summary.balance)}</p>
        </div>
      </div>

      <SimulationChart
        locale={locale}
        scenarioData={scenarioData}
        selectedScenario={selectedScenario}
        visibleSeries={visibleSeries}
        setVisibleSeries={setVisibleSeries}
      />
      <div className="mb-10 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-foreground text-background hover:bg-foreground/90"
          onClick={() => {
            const url = window.location.href;
            const text = t(
              "資産形成シミュレーションの結果を共有します。",
              "Sharing results from the Asset Formation Simulator.",
            );
            const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
              text,
            )}&url=${encodeURIComponent(url)}`;
            window.open(shareUrl, "_blank", "noopener,noreferrer");
          }}
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.963 6.817H1.68l7.73-8.84L1.25 2.25h6.828l4.713 6.231 5.454-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
          </svg>
          {t("ポスト", "Post")}
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <label htmlFor="visible-scenario-select" className="text-foreground/70">
            {t("表示パターン", "Visible scenario")}
          </label>
          <select
            id="visible-scenario-select"
            className="border rounded-md px-2 py-1"
            style={inputStyle}
            value={selectedScenarioId}
            onChange={(event) => setSelectedScenarioId(event.target.value)}
          >
            {scenarioData.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.label}
              </option>
            ))}
          </select>
        </div>
        <table className="w-full text-sm border border-collapse">
          <thead>
            <tr className="bg-foreground/5">
              <th className="border px-3 py-2 text-left">{t("年数", "Years")}</th>
              <th className="border px-3 py-2 text-right">
                {t("元本（累計）", "Principal (total)")}
              </th>
              <th className="border px-3 py-2 text-right">{t("運用益", "Gain")}</th>
              <th className="border px-3 py-2 text-right">{t("前年差（運用益）", "YoY gain")}</th>
              <th className="border px-3 py-2 text-right">{t("評価額", "Balance")}</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.month}>
                <td className="border px-3 py-2">{formatYears(row.month)}</td>
                <td className="border px-3 py-2 text-right">
                  {numberFormatter.format(Math.round(row.principal))}
                </td>
                <td className="border px-3 py-2 text-right">
                  {numberFormatter.format(Math.round(row.gain))}
                </td>
                <td className="border px-3 py-2 text-right">
                  {numberFormatter.format(Math.round(row.gainDiff))}
                </td>
                <td className="border px-3 py-2 text-right">
                  {numberFormatter.format(Math.round(row.balance))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export type ScheduleRow = {
  month: number;
  principal: number;
  gain: number;
  balance: number;
};

export type YearlyRow = ScheduleRow & {
  gainDiff: number;
};

export type ScenarioInput = {
  id: string;
  name: string;
  monthlyContributionInput: string;
  annualRateInput: string;
};

export type ScenarioData = {
  id: string;
  monthlyContribution: number;
  annualRate: number;
  schedule: ScheduleRow[];
  tableRows: YearlyRow[];
  color: string;
  label: string;
};

export type VisibleState = Record<string, boolean>;
export type ColorState = Record<string, string>;

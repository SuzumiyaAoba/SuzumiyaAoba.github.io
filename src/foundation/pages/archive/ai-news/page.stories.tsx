import type { Meta, StoryObj } from "@storybook/react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { AiNewsPageContent } from "./ui/page-content";
import { AiNewsTimelinePageContent } from "./ui/timeline-page-content";
import type { RenderedRelease } from "./model/release-calendar";

async function chooseCalendarDate(canvasElement: HTMLElement, date: string) {
  const canvas = within(canvasElement);
  const document = within(canvasElement.ownerDocument.body);
  const [year, month, day] = date.split("-");
  const trigger = canvas.getByRole("button", { name: "月へ移動" });
  await userEvent.click(trigger);
  const picker = within(document.getByRole("dialog", { name: "移動する日付を選択" }));
  await userEvent.selectOptions(picker.getByRole("combobox", { name: "年を選択" }), year!);
  await userEvent.selectOptions(
    picker.getByRole("combobox", { name: "月を選択" }),
    String(Number(month) - 1),
  );
  await userEvent.click(
    picker.getByRole("button", { name: new RegExp(`${year}年${Number(month)}月${Number(day)}日`) }),
  );
  await waitFor(() =>
    expect(document.queryByRole("dialog", { name: "移動する日付を選択" })).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());
}

function release(
  title: string,
  date: string | undefined,
  provider: string,
  series: string[],
  kind = "LLM Model",
): RenderedRelease {
  return {
    title,
    summary: (
      <p>
        <a href="https://example.com/release" target="_blank" rel="noopener noreferrer">
          Official announcement
        </a>
      </p>
    ),
    entry: {
      year: Number(date?.slice(0, 4) ?? 2026),
      ...(date ? { date } : {}),
      title: { ja: title, en: title },
      summary: { ja: "Release announcement" },
      tags: [provider, kind],
      series,
    },
  };
}

const entries = [
  release("GPT Next", "2026-03-05", "OpenAI", ["GPT"]),
  release("Gemini Flash Next", "2026-03-05", "Google", ["Gemini Flash"]),
  release("Claude Sonnet Next", "2026-02-17", "Anthropic", ["Claude Sonnet"]),
  release("Claude Opus Next", "2026-02-05", "Anthropic", ["Claude Opus"]),
  release("GPT Previous", "2026-01-01", "OpenAI", ["GPT"]),
  release("Claude Opus Previous", "2025-12-31", "Anthropic", ["Claude Opus"]),
  release("GPT Image", "2025-12-20", "OpenAI", ["GPT Image"], "Image Model"),
  release("Unknown date", undefined, "DeepSeek", ["DeepSeek"]),
];

const meta = {
  title: "Pages/Archive/AiNews",
  component: AiNewsPageContent,
  parameters: { layout: "fullscreen" },
  args: { locale: "ja", updated: "2026-03-06", entries, today: "2026-03-06" },
} satisfies Meta<typeof AiNewsPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OriginalTimeline: Story = {
  render: (args) => <AiNewsTimelinePageContent {...args} />,
};

export const Japanese: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const document = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByRole("heading", { name: "全期間のリリース間隔" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "全期間の比較" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    for (const provider of ["OpenAI", "Anthropic", "Google", "DeepSeek"]) {
      await expect(
        canvas
          .getByRole("button", { name: provider })
          .querySelector(`[data-provider-icon="${provider}"] svg`),
      ).not.toBeNull();
    }
    await expect(
      canvas.queryByRole("region", { name: "選択日のリリース詳細" }),
    ).not.toBeInTheDocument();
    await expect(document.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /GPT · 2026年3月5日/ }));
    await expect(document.getByRole("article", { name: "GPT Next" })).toHaveTextContent(
      "前回から 63 日",
    );
    await userEvent.click(canvas.getByRole("button", { name: "カレンダー" }));
    const scroll = canvas.getByRole("region", { name: "横スクロールカレンダー" });
    const today = within(scroll).getByRole("button", { name: /^2026年3月6日:/ });
    await expect(today).toHaveAttribute("aria-current", "date");
    await expect(today).toHaveAttribute("aria-pressed", "true");
    const march = scroll.querySelector<HTMLElement>('[data-calendar-month="2026-03"]')!;
    await expect(within(march).getAllByRole("columnheader")).toHaveLength(7);
    await expect(march.querySelectorAll("tbody tr")).toHaveLength(6);
    await expect(march.querySelectorAll("[data-calendar-date]")).toHaveLength(31);
    await waitFor(() =>
      expect(
        Math.abs(march.getBoundingClientRect().left - scroll.getBoundingClientRect().left - 16),
      ).toBeLessThan(1),
    );
    await userEvent.click(today);
    await expect(document.getByText("この日のリリース記録はありません。")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /直前のリリース/ }));
    const releaseDay = within(scroll).getByRole("button", { name: /^2026年3月5日:/ });
    await userEvent.hover(releaseDay);
    await expect(document.getByRole("tooltip")).toHaveTextContent("Gemini Flash Next / GPT Next");
    await userEvent.click(releaseDay);
    await userEvent.unhover(releaseDay);
    await expect(document.getAllByRole("article")).toHaveLength(2);
    await expect(document.getByRole("article", { name: "GPT Next" })).toHaveTextContent(
      "前回から 63 日",
    );
    await expect(
      document.getAllByRole("link", { name: "Official announcement" })[0]!,
    ).toHaveAttribute("href", "https://example.com/release");
    await userEvent.click(canvas.getByRole("button", { name: "前の月" }));
    await expect(canvas.getByRole("button", { name: "月へ移動" })).toHaveTextContent("2026年2月");
    await chooseCalendarDate(canvasElement, "2025-12-01");
    await userEvent.click(within(scroll).getByRole("button", { name: /^2025年12月31日:/ }));
    await expect(document.getByRole("article", { name: "Claude Opus Previous" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "次の月" }));
    await expect(canvas.getByRole("button", { name: "月へ移動" })).toHaveTextContent("2026年1月");
    await userEvent.click(canvas.getByRole("button", { name: "今日に戻る" }));
    await expect(canvas.getByRole("button", { name: "月へ移動" })).toHaveTextContent("2026年3月");
    await waitFor(() =>
      expect(
        Math.abs(
          scroll.querySelector('[data-calendar-month="2026-03"]')!.getBoundingClientRect().left -
            scroll.getBoundingClientRect().left -
            16,
        ),
      ).toBeLessThan(1),
    );
  },
};

export const Filtering: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const document = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Anthropic" }));
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "モデル系列" }),
      "Claude Opus",
    );
    await expect(canvas.getByRole("status")).toHaveTextContent("8 件中 2 件");
    await userEvent.click(canvas.getByRole("button", { name: /Claude Opus · 2026年2月5日/ }));
    await expect(document.getByRole("article", { name: "Claude Opus Next" })).toHaveTextContent(
      "前回から 36 日",
    );
    const search = canvas.getByRole("searchbox", { name: "モデルを検索" });
    await userEvent.type(search, "ＮＥＸＴ");
    await expect(canvas.getByRole("status")).toHaveTextContent("8 件中 1 件");
    await expect(document.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /Claude Opus · 2026年2月5日/ }));
    await expect(document.getByRole("article", { name: "Claude Opus Next" })).toHaveTextContent(
      "Claude Opus Previous",
    );
    await userEvent.type(search, " missing");
    await expect(canvas.getByText("条件に一致するリリースがありません。")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "絞り込みを解除" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("8 件中 8 件");
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "リリースの種類" }),
      "image",
    );
    await expect(canvas.getByRole("status")).toHaveTextContent("8 件中 1 件");
    await userEvent.click(canvas.getByRole("button", { name: /GPT Image · 2025年12月20日/ }));
    await expect(document.getByRole("article", { name: "GPT Image" })).toBeVisible();
  },
};

export const Intervals: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const document = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "全期間の比較" }));
    const chart = within(canvas.getByRole("region", { name: "リリース間隔の比較チャート" }));
    await expect(
      chart.getByRole("button", { name: /Claude Opus · 2025年12月31日/ }),
    ).toBeInTheDocument();
    await expect(chart.getByRole("button", { name: /GPT · 2026年3月5日/ })).toBeInTheDocument();
    await userEvent.click(chart.getByRole("button", { name: /Claude Opus · 2026年2月5日/ }));
    await expect(document.getByRole("article", { name: "Claude Opus Next" })).toHaveTextContent(
      "前回から 36 日",
    );
    await userEvent.click(canvas.getByRole("button", { name: "カレンダー" }));
    await expect(document.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /^2026年3月6日:/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

export const UndatedAndEmptyMonth: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "カレンダー" }));
    await chooseCalendarDate(canvasElement, "2026-04-01");
    await userEvent.click(canvas.getByRole("button", { name: /^2026年4月1日:/ }));
    await expect(
      within(canvasElement.ownerDocument.body).getByText("この日のリリース記録はありません。"),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "DeepSeek" }));
    await expect(canvas.getByText("日付が未詳の 1 件は、一覧で確認できます。")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "一覧で見る" }));
    await expect(canvas.getByRole("article", { name: "Unknown date" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "絞り込みを解除" }));
    await expect(canvas.getAllByRole("article")).toHaveLength(8);
  },
};

export const English: Story = {
  args: { locale: "en" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const document = within(canvasElement.ownerDocument.body);
    await expect(
      canvas.getByRole("heading", { name: "Release intervals · All dates" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /GPT · March 5, 2026/ }));
    await expect(document.getByRole("article", { name: "GPT Next" })).toHaveTextContent(
      "After 63 days",
    );
    await userEvent.click(document.getByRole("button", { name: "Close release details" }));
    await expect(document.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Calendar" }));
    await expect(canvas.getByRole("heading", { name: "Monthly release calendar" })).toBeVisible();
    await expect(canvas.getByRole("table", { name: "March 2026 calendar" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /^March 6, 2026:/ })).toHaveAttribute(
      "aria-current",
      "date",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Jump to month" }));
    const picker = within(document.getByRole("dialog", { name: "Choose a date to navigate to" }));
    await userEvent.selectOptions(
      picker.getByRole("combobox", { name: "Choose the Year" }),
      "2024",
    );
    await userEvent.selectOptions(picker.getByRole("combobox", { name: "Choose the Month" }), "1");
    await userEvent.click(picker.getByRole("button", { name: /February 29.*2024/ }));
    await expect(canvas.getByRole("button", { name: /^February 29, 2024:/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "Jump to month" })).toHaveTextContent(
      "February 2024",
    );
    await userEvent.click(canvas.getByRole("button", { name: "List" }));
    await expect(canvas.getAllByRole("article")).toHaveLength(8);
  },
};

export const NearbyReleases: Story = {
  args: {
    entries: [
      release("Model A", "2026-01-01", "OpenAI", ["GPT"]),
      release("Model B", "2026-01-02", "OpenAI", ["GPT"]),
      release("Model C", "2026-01-03", "OpenAI", ["GPT"]),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const document = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "全期間の比較" }));
    const chart = within(canvas.getByRole("region", { name: "リリース間隔の比較チャート" }));
    const first = chart.getByRole("button", { name: /GPT · 2026年1月1日/ });
    const second = chart.getByRole("button", { name: /GPT · 2026年1月2日/ });
    await expect(
      second.getBoundingClientRect().top - first.getBoundingClientRect().top,
    ).toBeGreaterThanOrEqual(32);
    await userEvent.hover(first);
    await expect(document.getByRole("tooltip")).toHaveTextContent("Model A");
    await userEvent.unhover(first);
    await expect(document.queryByRole("tooltip")).not.toBeInTheDocument();
    await userEvent.click(first);
    await userEvent.unhover(first);
    await expect(document.getByRole("article", { name: "Model A" })).toBeVisible();
    await userEvent.hover(second);
    await expect(document.getByRole("dialog")).toHaveTextContent("Model A");
    await expect(document.queryByRole("tooltip")).not.toBeInTheDocument();
    await userEvent.click(second);
    await expect(document.getByRole("article", { name: "Model B" })).toHaveTextContent(
      "前回から 1 日",
    );
    await expect(document.getAllByRole("dialog")).toHaveLength(1);
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(document.getByRole("heading", { name: "Model B" }));
    await expect(document.getByRole("dialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(document.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(document.queryByRole("tooltip")).not.toBeInTheDocument();
    await expect(second).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(document.getByRole("dialog")).toHaveFocus();
    await userEvent.tab();
    await expect(document.getByRole("button", { name: "リリースの詳細を閉じる" })).toHaveFocus();
    await userEvent.tab();
    await expect(document.getByRole("link", { name: "Official announcement" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(second).toHaveFocus();
    await userEvent.click(second);
    await expect(document.getByRole("dialog")).toBeVisible();
    await userEvent.click(second);
    await expect(document.queryByRole("dialog")).not.toBeInTheDocument();
  },
};

export const FullHistory: Story = {
  args: {
    entries: [
      ...entries,
      release("Early GPT", "2019-11-05", "OpenAI", ["GPT"]),
      release("Middle GPT", "2021-03-25", "OpenAI", ["GPT"]),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const document = within(canvasElement.ownerDocument.body);
    const chartElement = canvas.getByRole("region", { name: "リリース間隔の比較チャート" });
    const chart = within(chartElement);
    const pointCount = chart.getAllByRole("button").length;
    await expect(chart.getByRole("button", { name: /GPT · 2019年11月5日/ })).toBeInTheDocument();
    await expect(chart.getByRole("button", { name: /GPT · 2026年3月5日/ })).toBeInTheDocument();
    await expect(canvas.queryByRole("combobox", { name: "表示年" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "最初の記録" }));
    await expect(chartElement.scrollLeft).toBe(0);
    await userEvent.click(chart.getByRole("button", { name: /GPT · 2019年11月5日/ }));
    await expect(document.getByRole("article", { name: "Early GPT" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "最新の記録" }));
    await userEvent.click(chart.getByRole("button", { name: /GPT · 2026年3月5日/ }));
    await expect(document.getByRole("article", { name: "GPT Next" })).toBeVisible();
    const popup = document.getByRole("dialog");
    const popupPosition = popup.getBoundingClientRect();
    chartElement.scrollLeft = 0;
    await fireEvent.scroll(chartElement);
    await expect(popup).toBeVisible();
    await expect(popup.getBoundingClientRect().left).toBe(popupPosition.left);
    await expect(popup.getBoundingClientRect().top).toBe(popupPosition.top);
    await userEvent.click(canvas.getByRole("button", { name: "最新の記録" }));
    const latestScroll = chartElement.scrollLeft;
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "年へ移動" }), "2021");
    await expect(chartElement.scrollLeft).toBeGreaterThan(0);
    await expect(chartElement.scrollLeft).toBeLessThan(latestScroll);
    await expect(chart.getAllByRole("button")).toHaveLength(pointCount);
    const originalWidth = chartElement.scrollWidth;
    await userEvent.click(canvas.getByRole("button", { name: "拡大" }));
    await waitFor(() => expect(chartElement.scrollWidth).toBeGreaterThan(originalWidth));
    await userEvent.click(canvas.getByRole("button", { name: "全期間を表示" }));
    await waitFor(() =>
      expect(chartElement.scrollWidth).toBeLessThanOrEqual(chartElement.clientWidth + 1),
    );
    await expect(chart.getAllByRole("button")).toHaveLength(pointCount);
    await userEvent.click(canvas.getByRole("button", { name: "Anthropic" }));
    await expect(chart.getByText("2019年", { exact: true })).toBeInTheDocument();
    await expect(
      chart.getByRole("button", { name: /Claude Opus · 2025年12月31日/ }),
    ).toBeInTheDocument();
    const search = canvas.getByRole("searchbox", { name: "モデルを検索" });
    await userEvent.type(search, "Opus Next");
    await userEvent.click(chart.getByRole("button", { name: /Claude Opus · 2026年2月5日/ }));
    await expect(document.getByRole("article", { name: "Claude Opus Next" })).toHaveTextContent(
      "前回から 36 日",
    );
    await expect(chart.getByText("2019年", { exact: true })).toBeInTheDocument();
    await expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.ownerDocument.documentElement.clientWidth,
    );
  },
};

export const DatePickerKeyboardAndCancel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const document = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "カレンダー" }));
    const trigger = canvas.getByRole("button", { name: "月へ移動" });
    await userEvent.click(trigger);
    const picker = within(document.getByRole("dialog", { name: "移動する日付を選択" }));
    await userEvent.click(picker.getByRole("button", { name: "次の月へ" }));
    await expect(picker.getByRole("combobox", { name: "月を選択" })).toHaveValue("3");
    await expect(trigger).toHaveTextContent("2026年3月");
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        document.queryByRole("dialog", { name: "移動する日付を選択" }),
      ).not.toBeInTheDocument(),
    );
    await expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    const reopened = within(document.getByRole("dialog", { name: "移動する日付を選択" }));
    await expect(reopened.getByRole("combobox", { name: "月を選択" })).toHaveValue("2");
    await waitFor(() =>
      expect(reopened.getByRole("button", { name: /2026年3月6日/ })).toHaveFocus(),
    );
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await expect(canvas.getByRole("button", { name: /^2026年3月7日:/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const CalendarAcrossYears: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "カレンダー" }));
    const scroll = canvas.getByRole("region", { name: "横スクロールカレンダー" });
    const monthPicker = canvas.getByRole("button", { name: "月へ移動" });
    await chooseCalendarDate(canvasElement, "2024-02-29");
    const leapDay = within(scroll).getByRole("button", { name: /^2024年2月29日:/ });
    await expect(leapDay).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(leapDay);
    await userEvent.keyboard("{ArrowRight}");
    await expect(monthPicker).toHaveTextContent("2024年3月");
    await waitFor(() =>
      expect(within(scroll).getByRole("button", { name: /^2024年3月1日:/ })).toHaveFocus(),
    );
    await userEvent.keyboard("{PageUp}");
    await expect(monthPicker).toHaveTextContent("2024年2月");
    monthPicker.focus();
    scroll.scrollLeft +=
      scroll.querySelector('[data-calendar-month="2024-02"]')!.getBoundingClientRect().width + 16;
    await waitFor(() => expect(monthPicker).toHaveTextContent("2024年3月"));
    await expect(monthPicker).toHaveFocus();
    await expect(scroll.querySelectorAll("[data-calendar-month]").length).toBeLessThan(7);
    await chooseCalendarDate(canvasElement, "2028-12-01");
    await userEvent.click(canvas.getByRole("button", { name: "次の月" }));
    await expect(monthPicker).toHaveTextContent("2029年1月");
    await expect(scroll.querySelectorAll("[data-calendar-month]").length).toBeLessThan(7);
    await userEvent.click(canvas.getByRole("button", { name: "今日に戻る" }));
    const initialLeft = scroll.scrollLeft;
    const monthWidth = scroll
      .querySelector('[data-calendar-month="2026-03"]')!
      .getBoundingClientRect().width;
    scroll.scrollLeft -= monthWidth + 16;
    await waitFor(() => expect(monthPicker).toHaveTextContent("2026年2月"));
    await expect(scroll.scrollLeft).toBeLessThan(initialLeft);
    await userEvent.click(canvas.getByRole("button", { name: "OpenAI" }));
    await expect(monthPicker).toHaveTextContent("2026年2月");
    await userEvent.click(canvas.getByRole("button", { name: "今日に戻る" }));
    await expect(monthPicker).toHaveTextContent("2026年3月");
    await chooseCalendarDate(canvasElement, "2010-01-01");
    scroll.scrollLeft = 0;
    await waitFor(() => expect(monthPicker).toHaveTextContent("2009年1月"));
    await waitFor(() => expect(scroll.scrollLeft).toBeGreaterThan(0));
  },
};

export const ListDetailsAndOrder: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "一覧" }));
    const list = within(canvas.getByRole("region", { name: "全期間のリリース一覧" }));
    await expect(list.getAllByRole("article")).toHaveLength(8);
    const gpt = within(list.getByRole("article", { name: "GPT Next" }));
    await expect(gpt.getAllByText("63")[0]).toBeVisible();
    await expect(gpt.queryByRole("link", { name: "Official announcement" })).not.toBeVisible();
    await userEvent.click(gpt.getByText("リリースの詳細"));
    await expect(gpt.getByRole("link", { name: "Official announcement" })).toHaveAttribute(
      "href",
      "https://example.com/release",
    );
    await expect(gpt.getByText("GPT Previous")).toBeVisible();
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "リリースの並び順" }),
      "oldest",
    );
    await expect(list.getAllByRole("article")[0]).toHaveAccessibleName("GPT Image");
    await expect(list.getAllByRole("article").at(-1)).toHaveAccessibleName("Unknown date");
  },
};

export const Empty: Story = {
  args: { entries: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("リリースデータがありません。")).toBeVisible();
    await expect(canvas.queryByRole("searchbox")).not.toBeInTheDocument();
  },
};

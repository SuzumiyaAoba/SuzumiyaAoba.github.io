import type { Meta, StoryObj } from "@storybook/react";
import { AiNewsPageContent } from "./ui/page-content";

const meta = {
  title: "Pages/Archive/AiNews",
  component: AiNewsPageContent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AiNewsPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Japanese: Story = {
  args: {
    locale: "ja",
    updated: "2024-01-01",
    entries: [
      {
        entry: {
          year: 2024,
          date: "2024-01-01",
          title: { ja: "ニュース 1", en: "News 1" },
          summary: { ja: "サマリー 1", en: "Summary 1" },
          tags: ["OpenAI"],
        } as any,
        title: "ニュース 1",
        summary: "サマリー 1",
      },
    ],
  },
};

export const English: Story = {
  args: {
    locale: "en",
    updated: "2024-01-01",
    entries: [
      {
        entry: {
          year: 2024,
          date: "2024-01-01",
          title: { ja: "News 1", en: "News 1" },
          summary: { ja: "Summary 1", en: "Summary 1" },
          tags: ["OpenAI"],
        } as any,
        title: "News 1",
        summary: "Summary 1",
      },
    ],
  },
};

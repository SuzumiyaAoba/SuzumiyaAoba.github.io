import type { Meta, StoryObj } from "@storybook/react";
import { ArticleHistory } from "./ArticleHistory";
import { subDays, formatISO } from "date-fns";

export default {
  title: "Components/ArticleHistory",
  component: ArticleHistory,
} satisfies Meta<typeof ArticleHistory>;

type Story = StoryObj<typeof ArticleHistory>;

const mockHistory = Array.from({ length: 5 }).map((_, i) => ({
  hash: `abcdef${i}`,
  date: formatISO(subDays(new Date(), i * 2)),
  message: `コミットメッセージ ${i + 1}`,
  author: "SuzumiyaAoba",
}));

export const Default: Story = {
  args: {
    history: mockHistory,
    createdDate: formatISO(subDays(new Date(), 30)),
    lastModified: formatISO(new Date()),
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs";
import { ArticleHistory } from "./ArticleHistory";
import { subDays, formatISO } from "date-fns";

export default {
  title: "Components/ArticleHistory",
  component: ArticleHistory,
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1f2937' },
      ],
    },
  },
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

export const DarkTheme: Story = {
  args: {
    history: mockHistory,
    createdDate: formatISO(subDays(new Date(), 30)),
    lastModified: formatISO(new Date()),
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const LongHistory: Story = {
  args: {
    history: Array.from({ length: 15 }).map((_, i) => ({
      hash: `abcdef${i}${Math.random().toString(36).substr(2, 9)}`,
      date: formatISO(subDays(new Date(), i)),
      message: `長いコミットメッセージサンプル ${i + 1}: Lorem ipsum dolor sit amet consectetur adipiscing elit`,
      author: "SuzumiyaAoba",
    })),
    createdDate: formatISO(subDays(new Date(), 30)),
    lastModified: formatISO(new Date()),
    repoUrl: "https://github.com/SuzumiyaAoba/SuzumiyaAoba.github.io",
  },
};

export const LongHistoryDark: Story = {
  args: {
    history: Array.from({ length: 15 }).map((_, i) => ({
      hash: `abcdef${i}${Math.random().toString(36).substr(2, 9)}`,
      date: formatISO(subDays(new Date(), i)),
      message: `長いコミットメッセージサンプル ${i + 1}: Lorem ipsum dolor sit amet consectetur adipiscing elit`,
      author: "SuzumiyaAoba",
    })),
    createdDate: formatISO(subDays(new Date(), 30)),
    lastModified: formatISO(new Date()),
    repoUrl: "https://github.com/SuzumiyaAoba/SuzumiyaAoba.github.io",
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const EmptyHistory: Story = {
  args: {
    history: [],
    createdDate: formatISO(subDays(new Date(), 30)),
    lastModified: formatISO(new Date()),
  },
};

export const EmptyHistoryDark: Story = {
  args: {
    history: [],
    createdDate: formatISO(subDays(new Date(), 30)),
    lastModified: formatISO(new Date()),
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

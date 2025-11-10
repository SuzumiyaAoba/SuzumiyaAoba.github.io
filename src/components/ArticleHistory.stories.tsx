import type { Meta, StoryObj } from "@storybook/react";
import { ArticleHistory } from "./ArticleHistory";
import { subDays, formatISO } from "date-fns";

export default {
  title: "Components/ArticleHistory",
  component: ArticleHistory,
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#1f2937" },
      ],
    },
  },
} satisfies Meta<typeof ArticleHistory>;

type Story = StoryObj<typeof ArticleHistory>;

export const Default: Story = {
  args: {
    createdDate: formatISO(subDays(new Date(), 30)),
    lastModified: formatISO(new Date()),
    filePath: "contents/blog/2025-10-05-llm/index.md",
    repoUrl: "https://github.com/SuzumiyaAoba/SuzumiyaAoba.github.io",
  },
};

export const DarkTheme: Story = {
  args: {
    createdDate: formatISO(subDays(new Date(), 30)),
    lastModified: formatISO(new Date()),
    filePath: "contents/blog/2025-10-05-llm/index.md",
    repoUrl: "https://github.com/SuzumiyaAoba/SuzumiyaAoba.github.io",
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const WithoutGitHubLink: Story = {
  args: {
    createdDate: formatISO(subDays(new Date(), 30)),
    lastModified: formatISO(new Date()),
  },
};

export const WithoutGitHubLinkDark: Story = {
  args: {
    createdDate: formatISO(subDays(new Date(), 30)),
    lastModified: formatISO(new Date()),
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

import type { Meta, StoryObj } from "@storybook/react";
import { SeriesListPageContent, type SeriesListPageContentProps } from "./ui/page-content";

const meta = {
  title: "Pages/Series/Index",
  component: SeriesListPageContent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SeriesListPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const dummySeries: SeriesListPageContentProps["seriesList"] = [
  {
    slug: "series-a",
    name: "Series A",
    description: "This is a description for Series A.",
    thumbnail: "iconify:ph:book-open",
    posts: ["post-1", "post-2"],
  },
  {
    slug: "series-b",
    name: "Series B",
    posts: ["post-3"],
  },
  {
    slug: "series-c",
    name: "Series C",
    description: "Another series description.",
    posts: [],
  },
];

export const Japanese: Story = {
  args: {
    locale: "ja",
    seriesList: dummySeries,
  },
};

export const English: Story = {
  args: {
    locale: "en",
    seriesList: dummySeries,
  },
};

export const Empty: Story = {
  args: {
    locale: "ja",
    seriesList: [],
  },
};

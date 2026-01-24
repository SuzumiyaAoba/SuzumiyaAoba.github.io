import type { Meta, StoryObj } from "@storybook/react";
import { SeriesDetailPageContent } from "./ui/page-content";

const meta = {
  title: "Pages/Series/Detail",
  component: SeriesDetailPageContent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SeriesDetailPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const dummySeriesRaw = {
  name: "Series A",
  slug: "series-a",
  description: "Series A Description",
  posts: ["post-1", "post-2"],
  thumbnail: "iconify:mdi:react",
} as any;

const dummyEntries = [
  {
    slug: "post-1",
    title: "Post 1",
    date: "2024-01-01",
    tags: ["Tag1", "Tag2"],
  },
  {
    slug: "post-2",
    title: "Post 2",
    date: "2024-01-02",
    tags: ["Tag3"],
  },
];

export const Japanese: Story = {
  args: {
    locale: "ja",
    series: dummySeriesRaw,
    entries: dummyEntries,
  },
};

export const English: Story = {
  args: {
    locale: "en",
    series: dummySeriesRaw,
    entries: dummyEntries,
  },
};

export const Empty: Story = {
  args: {
    locale: "ja",
    series: { ...dummySeriesRaw, posts: [] },
    entries: [],
  },
};

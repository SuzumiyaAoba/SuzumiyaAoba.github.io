import type { Meta, StoryObj } from "@storybook/react";
import { KeywordsIndexPageContent } from "./ui/page-content";

const meta = {
  title: "Pages/Keywords/Index",
  component: KeywordsIndexPageContent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof KeywordsIndexPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Japanese: Story = {
  args: {
    locale: "ja",
  },
};

export const English: Story = {
  args: {
    locale: "en",
  },
};

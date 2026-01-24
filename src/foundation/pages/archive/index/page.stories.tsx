import type { Meta, StoryObj } from "@storybook/react";
import { ArchivePageContent } from "./ui/page-content";

const meta = {
  title: "Pages/Archive/Index",
  component: ArchivePageContent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ArchivePageContent>;

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

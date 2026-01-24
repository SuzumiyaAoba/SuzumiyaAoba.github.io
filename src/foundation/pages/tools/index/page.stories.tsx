import type { Meta, StoryObj } from "@storybook/react";
import { ToolsIndexPageContent } from "./ui/page-content";

const meta = {
  title: "Pages/Tools/Index",
  component: ToolsIndexPageContent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ToolsIndexPageContent>;

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

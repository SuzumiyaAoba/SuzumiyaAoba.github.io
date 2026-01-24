import type { Meta, StoryObj } from "@storybook/react";
import { AsciiStandardCodePageContent } from "./ui/page-content";

const meta = {
  title: "Pages/Tools/AsciiStandardCode",
  component: AsciiStandardCodePageContent,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AsciiStandardCodePageContent>;

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

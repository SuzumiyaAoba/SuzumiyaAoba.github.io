import type { Meta, StoryObj } from "@storybook/react";
import { AsciiTable } from "./AsciiTable";

export default {
  title: "Components/AsciiTable",
  component: AsciiTable,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AsciiTable>;

type Story = StoryObj<typeof AsciiTable>;

export const Default: Story = {
  args: {},
};

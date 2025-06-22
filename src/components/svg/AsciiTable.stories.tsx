import type { Meta, StoryObj } from "@storybook/react";
import { AsciiTable } from "./AsciiTable";

export default {
  title: "Components/Svg/AsciiTable",
  component: AsciiTable,
} satisfies Meta<typeof AsciiTable>;

type Story = StoryObj<typeof AsciiTable>;

export const Default: Story = {
  args: {},
};

import type { Meta, StoryObj } from "@storybook/react";
import { AsciiInfo } from "./AsciiInfo";

export default {
  title: "Components/AsciiInfo",
  component: AsciiInfo,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AsciiInfo>;

type Story = StoryObj<typeof AsciiInfo>;

export const Default: Story = {
  args: {},
};

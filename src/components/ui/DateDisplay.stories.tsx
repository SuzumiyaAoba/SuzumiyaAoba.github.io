import type { Meta, StoryObj } from "@storybook/react";
import { DateDisplay } from "./DateDisplay";

export default {
  title: "Components/DateDisplay",
  component: DateDisplay,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DateDisplay>;

type Story = StoryObj<typeof DateDisplay>;

export const Default: Story = {
  args: {},
};

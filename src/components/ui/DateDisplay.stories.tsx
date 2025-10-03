import type { Meta, StoryObj } from "@storybook/react";
import { DateDisplay } from "./DateDisplay";

export default {
  title: "Components/Ui/DateDisplay",
  component: DateDisplay,
} satisfies Meta<typeof DateDisplay>;

type Story = StoryObj<typeof DateDisplay>;

export const Default: Story = {
  args: {
    date: new Date(),
  },
};

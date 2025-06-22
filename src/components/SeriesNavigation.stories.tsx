import type { Meta, StoryObj } from "@storybook/react";
import { SeriesNavigation } from "./SeriesNavigation";

export default {
  title: "Components/SeriesNavigation",
  component: SeriesNavigation,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SeriesNavigation>;

type Story = StoryObj<typeof SeriesNavigation>;

export const Default: Story = {
  args: {},
};

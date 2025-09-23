import type { Meta, StoryObj } from "@storybook/nextjs";
import { SeriesNavigation } from "./SeriesNavigation";

export default {
  title: "Components/SeriesNavigation",
  component: SeriesNavigation,
} satisfies Meta<typeof SeriesNavigation>;

type Story = StoryObj<typeof SeriesNavigation>;

export const Default: Story = {
  args: {},
};

import type { Meta, StoryObj } from "@storybook/react";
import { DevelopmentOnly } from "./DevelopmentOnly";

export default {
  title: "Components/DevelopmentOnly",
  component: DevelopmentOnly,
} satisfies Meta<typeof DevelopmentOnly>;

type Story = StoryObj<typeof DevelopmentOnly>;

export const Default: Story = {
  args: {},
};

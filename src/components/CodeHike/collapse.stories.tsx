import type { Meta, StoryObj } from "@storybook/react";
import { collapse } from "./collapse";

export default {
  title: "Components/CodeHike/collapse",
  component: collapse,
} satisfies Meta<typeof collapse>;

type Story = StoryObj<typeof collapse>;

export const Default: Story = {
  args: {},
};

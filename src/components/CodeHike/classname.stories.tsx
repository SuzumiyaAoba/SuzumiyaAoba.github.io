import type { Meta, StoryObj } from "@storybook/react";
import { classname } from "./classname";

export default {
  title: "Components/CodeHike/classname",
  component: classname,
} satisfies Meta<typeof classname>;

type Story = StoryObj<typeof classname>;

export const Default: Story = {
  args: {},
};

import type { Meta, StoryObj } from "@storybook/react";
import { select } from "./select";

export default {
  title: "Components/select",
  component: select,
} satisfies Meta<typeof select>;

type Story = StoryObj<typeof select>;

export const Default: Story = {
  args: {},
};

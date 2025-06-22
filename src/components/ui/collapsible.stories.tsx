import type { Meta, StoryObj } from "@storybook/react";
import { collapsible } from "./collapsible";

export default {
  title: "Components/collapsible",
  component: collapsible,
} satisfies Meta<typeof collapsible>;

type Story = StoryObj<typeof collapsible>;

export const Default: Story = {
  args: {},
};

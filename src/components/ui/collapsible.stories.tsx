import type { Meta, StoryObj } from "@storybook/react";
import { Collapsible } from "./collapsible";

export default {
  title: "Components/Ui/Collapsible",
  component: Collapsible,
} satisfies Meta<typeof Collapsible>;

type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  args: {},
};

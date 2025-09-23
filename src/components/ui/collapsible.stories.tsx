import type { Meta, StoryObj } from "@storybook/nextjs";
import { Collapsible } from "./collapsible";

export default {
  title: "Components/Ui/Collapsible",
  component: Collapsible,
} satisfies Meta<typeof Collapsible>;

type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  args: {},
};

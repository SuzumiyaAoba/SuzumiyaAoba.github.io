import { Breadcrumb } from "./breadcrumb";
import type { Meta, StoryObj } from "@storybook/react";

export default {
  title: "Components/ui/Breadcrumb",
  component: Breadcrumb,
} satisfies Meta<typeof Breadcrumb>;

type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {},
};

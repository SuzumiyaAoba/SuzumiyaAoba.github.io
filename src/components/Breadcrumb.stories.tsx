import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumb } from "./Breadcrumb";

export default {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
} satisfies Meta<typeof Breadcrumb>;

type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {},
};

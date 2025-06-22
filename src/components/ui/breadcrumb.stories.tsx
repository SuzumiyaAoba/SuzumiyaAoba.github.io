import type { Meta, StoryObj } from "@storybook/react";
import { breadcrumb } from "./breadcrumb";

export default {
  title: "Components/breadcrumb",
  component: breadcrumb,
} satisfies Meta<typeof breadcrumb>;

type Story = StoryObj<typeof breadcrumb>;

export const Default: Story = {
  args: {},
};

import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "./Pagination";

export default {
  title: "Components/Pagination",
  component: Pagination,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Pagination>;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {},
};

import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "./index";

export default {
  title: "components/Header",
  component: Header,
} satisfies Meta<typeof Header>;

type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    siteName: "Less is more",
  },
};

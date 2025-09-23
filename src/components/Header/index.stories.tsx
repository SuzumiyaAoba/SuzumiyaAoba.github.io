import type { Meta, StoryObj } from "@storybook/nextjs";
import { Header } from "./index";

export default {
  title: "Components/Header/Header",
  component: Header,
} satisfies Meta<typeof Header>;

type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    siteName: "Less is more",
  },
};

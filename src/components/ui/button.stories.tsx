import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "./button";

export default {
  title: "Components/Ui/button",
  component: Button,
} satisfies Meta<typeof Button>;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {},
};

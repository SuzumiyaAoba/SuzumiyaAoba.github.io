import type { Meta, StoryObj } from "@storybook/react";
import { SsgImage } from "./index";

export default {
  title: "Components/SsgImage",
  component: SsgImage,
} satisfies Meta<typeof SsgImage>;

type Story = StoryObj<typeof SsgImage>;

export const Default: Story = {
  args: {},
};

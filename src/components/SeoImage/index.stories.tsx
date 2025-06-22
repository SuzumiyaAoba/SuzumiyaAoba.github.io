import type { Meta, StoryObj } from "@storybook/react";
import { SeoImage } from "./index";

export default {
  title: "Components/SeoImage",
  component: SeoImage,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SeoImage>;

type Story = StoryObj<typeof SeoImage>;

export const Default: Story = {
  args: {},
};

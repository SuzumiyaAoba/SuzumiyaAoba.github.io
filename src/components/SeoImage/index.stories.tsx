import type { Meta, StoryObj } from "@storybook/nextjs";
import { SeoImage } from "./index";

export default {
  title: "Components/SeoImage/SeoImage",
  component: SeoImage,
} satisfies Meta<typeof SeoImage>;

type Story = StoryObj<typeof SeoImage>;

export const Default: Story = {
  args: {},
};

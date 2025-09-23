import type { Meta, StoryObj } from "@storybook/nextjs";
import { SsgImage } from "./index";

export default {
  title: "Components/SsgImage/SsgImage",
  component: SsgImage,
} satisfies Meta<typeof SsgImage>;

type Story = StoryObj<typeof SsgImage>;

export const Default: Story = {
  args: {},
};

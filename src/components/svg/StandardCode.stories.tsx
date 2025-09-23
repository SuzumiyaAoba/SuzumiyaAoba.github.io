import type { Meta, StoryObj } from "@storybook/nextjs";
import StandardCode from "./StandardCode";

export default {
  title: "Components/Svg/StandardCode",
  component: StandardCode,
} satisfies Meta<typeof StandardCode>;

type Story = StoryObj<typeof StandardCode>;

export const Default: Story = {
  args: {},
};

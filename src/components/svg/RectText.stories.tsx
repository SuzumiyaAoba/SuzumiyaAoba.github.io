import type { Meta, StoryObj } from "@storybook/react";
import { RectText } from "./RectText";

export default {
  title: "Components/Svg/RectText",
  component: RectText,
} satisfies Meta<typeof RectText>;

type Story = StoryObj<typeof RectText>;

export const Default: Story = {
  args: {},
};

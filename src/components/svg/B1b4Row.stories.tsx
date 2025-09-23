import type { Meta, StoryObj } from "@storybook/nextjs";
import { B1b4Row } from "./B1b4Row";

export default {
  title: "Components/Svg/B1b4Row",
  component: B1b4Row,
} satisfies Meta<typeof B1b4Row>;

type Story = StoryObj<typeof B1b4Row>;

export const Default: Story = {
  args: {},
};

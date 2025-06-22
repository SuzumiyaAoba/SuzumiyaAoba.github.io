import type { Meta, StoryObj } from "@storybook/react";
import { TOC } from "./TOC";

export default {
  title: "Components/TOC",
  component: TOC,
} satisfies Meta<typeof TOC>;

type Story = StoryObj<typeof TOC>;

export const Default: Story = {
  args: {},
};

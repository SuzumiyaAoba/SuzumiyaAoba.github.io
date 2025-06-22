import type { Meta, StoryObj } from "@storybook/react";
import { DmmFx } from "./DmmFx";

export default {
  title: "Components/DmmFx",
  component: DmmFx,
} satisfies Meta<typeof DmmFx>;

type Story = StoryObj<typeof DmmFx>;

export const Default: Story = {
  args: {},
};

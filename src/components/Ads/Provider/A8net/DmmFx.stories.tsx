import type { Meta, StoryObj } from "@storybook/nextjs";
import { DmmFx } from "./DmmFx";

export default {
  title: "Components/Ads/Provider/A8net/DmmFx",
  component: DmmFx,
} satisfies Meta<typeof DmmFx>;

type Story = StoryObj<typeof DmmFx>;

export const Default: Story = {
  args: {},
};

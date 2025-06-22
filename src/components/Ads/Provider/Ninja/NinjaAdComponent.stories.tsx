import type { Meta, StoryObj } from "@storybook/react";
import { NinjaAdComponent } from "./NinjaAdComponent";

export default {
  title: "Components/NinjaAdComponent",
  component: NinjaAdComponent,
} satisfies Meta<typeof NinjaAdComponent>;

type Story = StoryObj<typeof NinjaAdComponent>;

export const Default: Story = {
  args: {
    adId: "1234567890",
    adType: "banner",
    width: 320,
    height: 50,
    description: "Sample Ninja Ad",
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import { NinjaAdComponent } from "./NinjaAdComponent";

export default {
  title: "Components/NinjaAdComponent",
  component: NinjaAdComponent,
} satisfies Meta<typeof NinjaAdComponent>;

type Story = StoryObj<typeof NinjaAdComponent>;

export const Default: Story = {
  args: {},
};

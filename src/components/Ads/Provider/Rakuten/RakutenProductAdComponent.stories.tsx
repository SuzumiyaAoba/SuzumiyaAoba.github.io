import type { Meta, StoryObj } from "@storybook/react";
import { RakutenProductAdComponent } from "./RakutenProductAdComponent";

export default {
  title: "Components/RakutenProductAdComponent",
  component: RakutenProductAdComponent,
} satisfies Meta<typeof RakutenProductAdComponent>;

type Story = StoryObj<typeof RakutenProductAdComponent>;

export const Default: Story = {
  args: {},
};

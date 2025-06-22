import type { Meta, StoryObj } from "@storybook/react";
import { RakutenProductAdComponent } from "./RakutenProductAdComponent";

export default {
  title: "Components/RakutenProductAdComponent",
  component: RakutenProductAdComponent,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof RakutenProductAdComponent>;

type Story = StoryObj<typeof RakutenProductAdComponent>;

export const Default: Story = {
  args: {},
};

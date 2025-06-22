import type { Meta, StoryObj } from "@storybook/react";
import { A8netAdComponent } from "./A8netAdComponent";

export default {
  title: "Components/A8netAdComponent",
  component: A8netAdComponent,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof A8netAdComponent>;

type Story = StoryObj<typeof A8netAdComponent>;

export const Default: Story = {
  args: {},
};

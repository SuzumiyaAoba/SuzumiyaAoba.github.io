import type { Meta, StoryObj } from "@storybook/react";
import { Provider } from "./Provider";

export default {
  title: "Components/Provider",
  component: Provider,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Provider>;

type Story = StoryObj<typeof Provider>;

export const Default: Story = {
  args: {},
};

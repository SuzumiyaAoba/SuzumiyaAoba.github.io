import type { Meta, StoryObj } from "@storybook/react";
import { KiddyFirst } from "./KiddyFirst";

export default {
  title: "Components/KiddyFirst",
  component: KiddyFirst,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof KiddyFirst>;

type Story = StoryObj<typeof KiddyFirst>;

export const Default: Story = {
  args: {},
};

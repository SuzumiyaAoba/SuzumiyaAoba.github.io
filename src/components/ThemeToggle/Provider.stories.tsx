import type { Meta, StoryObj } from "@storybook/react";
import { Provider } from "./Provider";

export default {
  title: "Components/ThemeToggle/Provider",
  component: Provider,
} satisfies Meta<typeof Provider>;

type Story = StoryObj<typeof Provider>;

export const Default: Story = {
  args: {},
};

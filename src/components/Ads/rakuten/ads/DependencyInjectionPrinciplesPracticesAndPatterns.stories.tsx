import type { Meta, StoryObj } from "@storybook/react";
import { DependencyInjectionPrinciplesPracticesAndPatterns } from "./DependencyInjectionPrinciplesPracticesAndPatterns";

export default {
  title: "Components/DependencyInjectionPrinciplesPracticesAndPatterns",
  component: DependencyInjectionPrinciplesPracticesAndPatterns,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DependencyInjectionPrinciplesPracticesAndPatterns>;

type Story = StoryObj<typeof DependencyInjectionPrinciplesPracticesAndPatterns>;

export const Default: Story = {
  args: {},
};

import type { Meta, StoryObj } from "@storybook/nextjs";
import { DependencyInjectionPrinciplesPracticesAndPatterns } from "./DependencyInjectionPrinciplesPracticesAndPatterns";

export default {
  title: "Components/Ads/Rakuten/Ads/DependencyInjectionPrinciplesPracticesAndPatterns",
  component: DependencyInjectionPrinciplesPracticesAndPatterns,
} satisfies Meta<typeof DependencyInjectionPrinciplesPracticesAndPatterns>;

type Story = StoryObj<typeof DependencyInjectionPrinciplesPracticesAndPatterns>;

export const Default: Story = {
  args: {},
};

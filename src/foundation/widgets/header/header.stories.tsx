import type { Meta, StoryObj } from "@storybook/react";

import { Header } from "@/widgets/header";

const meta: Meta<typeof Header> = {
  title: "widgets/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof Header>;

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="px-6 py-8 text-sm text-muted-foreground">Header preview</div>
    </div>
  ),
};

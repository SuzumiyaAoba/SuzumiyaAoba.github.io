import type { Meta, StoryObj } from "@storybook/react";

import { EmptyPage } from "@/shared/ui/empty-page";

const meta: Meta<typeof EmptyPage> = {
  title: "shared/EmptyPage",
  component: EmptyPage,
};

export default meta;

type Story = StoryObj<typeof EmptyPage>;

export const Default: Story = {};

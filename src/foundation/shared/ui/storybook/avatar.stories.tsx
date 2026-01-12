import type { Meta, StoryObj } from "@storybook/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

const meta: Meta<typeof Avatar> = {
  title: "shared/Avatar",
  component: Avatar,
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/100" alt="User" />
      <AvatarFallback>SU</AvatarFallback>
    </Avatar>
  ),
};

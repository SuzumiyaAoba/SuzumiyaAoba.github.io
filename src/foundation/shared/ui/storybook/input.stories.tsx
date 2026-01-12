import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const meta: Meta<typeof Input> = {
  title: "shared/Input",
  component: Input,
  args: {
    placeholder: "you@example.com",
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: (args) => (
    <div className="grid w-80 gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" {...args} />
    </div>
  ),
};

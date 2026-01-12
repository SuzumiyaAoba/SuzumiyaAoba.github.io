import type { Meta, StoryObj } from "@storybook/react";

import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

const meta: Meta<typeof Textarea> = {
  title: "shared/Textarea",
  component: Textarea,
  args: {
    placeholder: "Write a short note...",
  },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: (args) => (
    <div className="grid w-96 gap-2">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" {...args} />
    </div>
  ),
};

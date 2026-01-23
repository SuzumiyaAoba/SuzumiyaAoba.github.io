import type { Meta, StoryObj } from "@storybook/react";

import { Message, MessageContent } from "@/shared/ui/ai-elements/message";

const meta: Meta<typeof Message> = {
  title: "shared/ai-elements/Message",
  component: Message,
  args: {
    from: "assistant",
    showAvatar: true,
    children: <MessageContent>Hello, this is a message.</MessageContent>,
  },
  argTypes: {
    from: {
      control: "radio",
      options: ["user", "assistant"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Message>;

export const Assistant: Story = {
  args: {
    from: "assistant",
  },
};

export const User: Story = {
  args: {
    from: "user",
    children: (
      <MessageContent from="user" variant="flat">
        This is a user message.
      </MessageContent>
    ),
  },
};

export const NoAvatar: Story = {
  args: {
    from: "assistant",
    showAvatar: false,
  },
};

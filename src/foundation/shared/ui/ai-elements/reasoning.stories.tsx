import type { Meta, StoryObj } from "@storybook/react";

import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/shared/ui/ai-elements/reasoning";

const meta: Meta<typeof Reasoning> = {
  title: "shared/ai-elements/Reasoning",
  component: Reasoning,
  args: {
    defaultOpen: false,
    children: (
      <>
        <ReasoningTrigger />
        <ReasoningContent>
          <p>Reasoning process step 1...</p>
          <p>Reasoning process step 2...</p>
        </ReasoningContent>
      </>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof Reasoning>;

export const Default: Story = {};

export const Open: Story = {
  args: {
    defaultOpen: true,
  },
};

export const CustomTrigger: Story = {
  args: {
    children: (
      <>
        <ReasoningTrigger>Custom Trigger Text</ReasoningTrigger>
        <ReasoningContent>
          Content here.
        </ReasoningContent>
      </>
    ),
  },
};

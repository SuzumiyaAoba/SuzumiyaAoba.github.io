import type { Meta, StoryObj } from "@storybook/react";

import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/shared/ui/ai-elements/tool";

const meta: Meta<typeof Tool> = {
  title: "shared/ai-elements/Tool",
  component: Tool,
  args: {
    defaultOpen: true,
    children: (
      <>
        <ToolHeader title="search_web" state="output-available" />
        <ToolContent>
          <ToolInput input={{ query: "next.js storybook" }} />
          <ToolOutput output={{ results: ["Result 1", "Result 2"] }} />
        </ToolContent>
      </>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof Tool>;

export const Completed: Story = {};

export const Running: Story = {
  args: {
    children: (
      <>
        <ToolHeader title="generate_image" state="input-available" />
        <ToolContent>
          <ToolInput input={{ prompt: "A cat" }} />
        </ToolContent>
      </>
    ),
  },
};

export const Streaming: Story = {
  args: {
    children: (
      <>
        <ToolHeader title="search_web" state="input-streaming" />
        <ToolContent>
          <ToolInput input={{ query: "streaming..." }} />
        </ToolContent>
      </>
    ),
  },
};

export const Error: Story = {
  args: {
    children: (
      <>
        <ToolHeader title="compile_code" state="output-error" />
        <ToolContent>
          <ToolInput input={{ file: "test.ts" }} />
          <ToolOutput errorText="Compilation failed" />
        </ToolContent>
      </>
    ),
  },
};

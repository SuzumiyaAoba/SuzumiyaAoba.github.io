import type { Meta, StoryObj } from "@storybook/react";

import { Response } from "@/shared/ui/ai-elements/response";

const meta: Meta<typeof Response> = {
  title: "shared/ai-elements/Response",
  component: Response,
  args: {
    children: (
      <>
        <p>This is a response paragraph.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
        <pre>
          <code>console.log("Hello");</code>
        </pre>
      </>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof Response>;

export const Default: Story = {};

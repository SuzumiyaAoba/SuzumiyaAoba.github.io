import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

export default {
  title: "Components/ui/Tooltip",
  component: Tooltip,
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">
          Hover me
        </TooltipTrigger>
        <TooltipContent>Tooltip content</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
} satisfies Meta<typeof Tooltip>;

type Story = StoryObj;

export const Default: Story = {};

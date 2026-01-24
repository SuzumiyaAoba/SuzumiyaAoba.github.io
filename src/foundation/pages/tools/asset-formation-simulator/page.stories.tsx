import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { AssetFormationSimulatorPageContent } from "./ui/page-content";

const meta = {
  title: "Pages/Tools/AssetFormationSimulator",
  component: AssetFormationSimulatorPageContent,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <Suspense fallback={<div>Loading (Storybook Suspense)...</div>}>
        <Story />
      </Suspense>
    ),
  ],
} satisfies Meta<typeof AssetFormationSimulatorPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Japanese: Story = {
  args: {
    locale: "ja",
  },
};

export const English: Story = {
  args: {
    locale: "en",
  },
};

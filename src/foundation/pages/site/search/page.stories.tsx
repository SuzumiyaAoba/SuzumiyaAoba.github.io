import type { Meta, StoryObj } from "@storybook/react";

import { SearchPageContent } from "./ui/page";

const meta: Meta<typeof SearchPageContent> = {
  title: "pages/site/Search",
  component: SearchPageContent,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    locale: "ja",
  },
  argTypes: {
    locale: {
      control: "radio",
      options: ["ja", "en"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof SearchPageContent>;

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

import type { Meta, StoryObj } from "@storybook/react";

import { NotFoundPageContent } from "./ui/page";

const meta: Meta<typeof NotFoundPageContent> = {
  title: "pages/site/NotFound",
  component: NotFoundPageContent,
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

type Story = StoryObj<typeof NotFoundPageContent>;

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

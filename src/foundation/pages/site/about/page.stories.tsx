import type { Meta, StoryObj } from "@storybook/react";

import { AboutPageContent } from "./ui/page";

const meta: Meta<typeof AboutPageContent> = {
  title: "pages/site/About",
  component: AboutPageContent,
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

type Story = StoryObj<typeof AboutPageContent>;

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

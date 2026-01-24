import type { Meta, StoryObj } from "@storybook/react";

import { ContactPageContent } from "./ui/page";

const meta: Meta<typeof ContactPageContent> = {
  title: "pages/site/Contact",
  component: ContactPageContent,
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

type Story = StoryObj<typeof ContactPageContent>;

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

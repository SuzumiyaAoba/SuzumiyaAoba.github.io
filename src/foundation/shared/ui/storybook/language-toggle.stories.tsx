import type { Meta, StoryObj } from "@storybook/react";

import { LanguageToggle } from "@/shared/ui/language-toggle";

const meta: Meta<typeof LanguageToggle> = {
  title: "shared/LanguageToggle",
  component: LanguageToggle,
  args: {
    path: "/example",
  },
  argTypes: {
    locale: {
      control: "radio",
      options: ["ja", "en"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof LanguageToggle>;

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

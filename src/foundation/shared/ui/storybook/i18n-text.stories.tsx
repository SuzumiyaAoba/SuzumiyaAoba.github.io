import type { Meta, StoryObj } from "@storybook/react";

import { I18nText } from "@/shared/ui/i18n-text";

const meta: Meta<typeof I18nText> = {
  title: "shared/I18nText",
  component: I18nText,
  args: {
    ja: "日本語",
    en: "English",
  },
  argTypes: {
    locale: {
      control: "radio",
      options: ["ja", "en"],
    },
    as: {
      control: "text",
    },
  },
};

export default meta;

type Story = StoryObj<typeof I18nText>;

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

export const CustomElement: Story = {
  args: {
    locale: "ja",
    as: "h1",
    className: "text-2xl font-bold",
  },
};

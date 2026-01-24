import type { Meta, StoryObj } from "@storybook/react";

import { PrivacyPolicyPageContent } from "./ui/page";

const meta: Meta<typeof PrivacyPolicyPageContent> = {
  title: "pages/site/PrivacyPolicy",
  component: PrivacyPolicyPageContent,
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

type Story = StoryObj<typeof PrivacyPolicyPageContent>;

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

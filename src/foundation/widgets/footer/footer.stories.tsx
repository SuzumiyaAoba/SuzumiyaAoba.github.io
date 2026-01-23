import type { Meta, StoryObj } from "@storybook/react";

import { Footer } from "@/widgets/footer";

const meta: Meta<typeof Footer> = {
  title: "widgets/Footer",
  component: Footer,
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

type Story = StoryObj<typeof Footer>;

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

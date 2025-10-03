import type { Meta, StoryObj } from "@storybook/react";
import { Footer } from "./index";

export default {
  title: "Components/Footer/Footer",
  component: Footer,
} satisfies Meta<typeof Footer>;

type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  args: {
    copyright: "SuzumiyaAoba",
    poweredBy: {
      name: "Next.js",
      url: "https://nextjs.org",
    },
  },
};

export const Text: Story = {
  args: {
    ...Default.args,
    poweredBy: "Next.js",
  },
};

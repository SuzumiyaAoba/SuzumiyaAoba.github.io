import type { Meta, StoryObj } from "@storybook/react";

import { Tag } from "@/shared/ui/tag";

const meta: Meta<typeof Tag> = {
  title: "shared/Tag",
  component: Tag,
  args: {
    tag: "Next.js",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "destructive"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: {
    tag: "Next.js",
  },
};

export const WithIcon: Story = {
  args: {
    tag: "React",
  },
};

export const WithLink: Story = {
  args: {
    tag: "Link",
    href: "#",
  },
};

export const CustomLabel: Story = {
  args: {
    tag: "next.js",
    label: "NEXT.JS",
  },
};

export const Outline: Story = {
  args: {
    tag: "Outline",
    variant: "outline",
  },
};

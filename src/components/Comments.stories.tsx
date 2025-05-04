import type { Meta, StoryObj } from "@storybook/react";

import { Comments } from "./Comments";

export default {
  title: "Components/Comments",
  component: Comments,
  argTypes: {
    theme: {
      control: { type: "select" },
      options: [
        "light",
        "light_high_contrast",
        "light_protanopia",
        "dark",
        "dark_high_contrast",
        "dark_protanopia",
        "dark_dimmed",
        "transparent_dark",
        "preferred_color_scheme",
      ],
    },
    mapping: {
      control: { type: "select" },
      options: ["pathname", "url", "title", "og:title", "specific", "number"],
    },
    inputPosition: {
      control: { type: "radio" },
      options: ["top", "bottom"],
    },
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Comments>;

type Story = StoryObj<typeof Comments>;

export const Default: Story = {
  args: {},
};

export const DarkTheme: Story = {
  args: {
    theme: "dark",
  },
};

export const BottomInputPosition: Story = {
  args: {
    inputPosition: "bottom",
  },
};

export const CustomRepository: Story = {
  args: {
    repo: "facebook/react",
    repoId: "MDEwOlJlcG9zaXRvcnkxMDI3MDI1MA==",
    category: "Announcements",
    categoryId: "DIC_kwDOAJy2Ks4CXR5M",
  },
};

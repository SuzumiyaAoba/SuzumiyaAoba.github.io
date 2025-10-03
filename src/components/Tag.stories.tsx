import type { Meta, StoryObj } from "@storybook/react";

import { Tag } from "./Tag";

export default {
  title: "Components/Tag",
  component: Tag,
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: { type: "select" },
      options: ["default", "primary", "secondary"],
    },
  },
} satisfies Meta<typeof Tag>;

type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: {
    label: "タグ",
  },
};

export const Small: Story = {
  args: {
    label: "小サイズ",
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    label: "中サイズ",
    size: "md",
  },
};

export const Large: Story = {
  args: {
    label: "大サイズ",
    size: "lg",
  },
};

export const PrimaryVariant: Story = {
  args: {
    label: "Primary",
    variant: "primary",
  },
};

export const SecondaryVariant: Story = {
  args: {
    label: "Secondary",
    variant: "secondary",
  },
};

export const WithLink: Story = {
  args: {
    label: "リンク付き",
    href: "/",
  },
};

export const AllTags: StoryObj = {
  render: (args) => {
    return (
      <div className="flex flex-wrap gap-2">
        {[
          "Java",
          "Scala",
          "Astro",
          "Next.js",
          "Nix",
          "Tmux",
          "Emacs",
          "Ollama",
          "プログラミング",
        ].map((name) => (
          <Tag key={name} label={name} />
        ))}
      </div>
    );
  },
};

export const AllVariantsAndSizes: StoryObj = {
  render: () => {
    const variants = ["default", "primary", "secondary"] as const;
    const sizes = ["sm", "md", "lg"] as const;

    return (
      <div className="space-y-4">
        {variants.map((variant) => (
          <div key={variant} className="space-y-2">
            <h3 className="font-bold">
              {variant.charAt(0).toUpperCase() + variant.slice(1)} Variant
            </h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <Tag
                  key={`${variant}-${size}`}
                  label={`${size}-${variant}`}
                  variant={variant}
                  size={size}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  },
};

import type { Meta, StoryObj } from "@storybook/react";

import { Tag } from "./Tag";

export default {
  title: "Components/Tag",
  component: Tag,
} satisfies Meta<typeof Tag>;

type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: {
    label: "タグ",
  },
};

export const AllTags: StoryObj = {
  render: (args) => {
    return (
      <>
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
          <div key={name} className="flex my-2">
            <Tag label={name} />
          </div>
        ))}
      </>
    );
  },
};

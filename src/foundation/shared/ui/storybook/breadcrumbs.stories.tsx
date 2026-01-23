import type { Meta, StoryObj } from "@storybook/react";

import { Breadcrumbs } from "@/shared/ui/breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = {
  title: "shared/Breadcrumbs",
  component: Breadcrumbs,
  args: {
    items: [],
  },
};

export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  args: {
    items: [
      { name: "Home", path: "/" },
      { name: "Category", path: "/category" },
      { name: "Page", path: "/category/page" },
    ],
  },
};

export const SingleItem: Story = {
  args: {
    items: [{ name: "Home", path: "/" }],
  },
};

export const LongItems: Story = {
  args: {
    items: [
      { name: "Home", path: "/" },
      { name: "Deep", path: "/deep" },
      { name: "Nested", path: "/deep/nested" },
      { name: "Structure", path: "/deep/nested/structure" },
      { name: "Is", path: "/deep/nested/structure/is" },
      { name: "Here", path: "/deep/nested/structure/is/here" },
    ],
  },
};

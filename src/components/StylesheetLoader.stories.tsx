import type { Meta, StoryObj } from "@storybook/react";
import { StylesheetLoader } from "./StylesheetLoader";

export default {
  title: "Components/StylesheetLoader",
  component: StylesheetLoader,
} satisfies Meta<typeof StylesheetLoader>;

type Story = StoryObj<typeof StylesheetLoader>;

const dummyArgs = {
  stylesheets: [], // Storybook では実際にロードしない
  basePath: "blog",
  slug: "sample-post",
};

export const Default: Story = {
  args: dummyArgs,
};

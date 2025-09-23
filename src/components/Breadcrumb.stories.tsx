import type { Meta, StoryObj } from "@storybook/nextjs";
import BreadcrumbNav from "./Breadcrumb";

const mockMaps = {
  blogTitleMap: { "sample-post": "サンプル記事" },
  keywordTitleMap: { programming: "プログラミング" },
  bookTitleMap: { "java-abc": "Java ABC" },
};

export default {
  title: "Components/Breadcrumb",
  component: BreadcrumbNav,
} satisfies Meta<typeof BreadcrumbNav>;

type Story = StoryObj<typeof BreadcrumbNav>;

export const Default: Story = {
  args: mockMaps,
};

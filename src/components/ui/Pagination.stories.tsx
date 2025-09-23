import type { Meta, StoryObj } from "@storybook/nextjs";
import { Pagination } from "./Pagination";

export default {
  title: "Components/Ui/Pagination",
  component: Pagination,
  argTypes: {
    currentPage: {
      control: { type: "number", min: 1 },
    },
    totalPages: {
      control: { type: "number", min: 1 },
    },
  },
} satisfies Meta<typeof Pagination>;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    basePath: "blog",
  },
};

export const FewPages: Story = {
  args: {
    currentPage: 2,
    totalPages: 3,
    basePath: "blog",
  },
};

export const CurrentPageIsTwo: Story = {
  args: {
    currentPage: 2,
    totalPages: 10,
    basePath: "blog",
  },
};

export const CurrentPageIsThree: Story = {
  args: {
    currentPage: 3,
    totalPages: 10,
    basePath: "blog",
  },
};

export const MiddlePage: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    basePath: "blog",
  },
};

export const NearLastPage: Story = {
  args: {
    currentPage: 8,
    totalPages: 10,
    basePath: "blog",
  },
};

export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
    basePath: "blog",
  },
};

export const SecondToLastPage: Story = {
  args: {
    currentPage: 9,
    totalPages: 10,
    basePath: "blog",
  },
};

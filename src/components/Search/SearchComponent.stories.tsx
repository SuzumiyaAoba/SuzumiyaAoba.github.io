import type { Meta, StoryObj } from "@storybook/react";
import { SearchComponent } from "./SearchComponent";

export default {
  title: "Components/SearchComponent",
  component: SearchComponent,
} satisfies Meta<typeof SearchComponent>;

type Story = StoryObj<typeof SearchComponent>;

export const Default: Story = {
  args: {},
};

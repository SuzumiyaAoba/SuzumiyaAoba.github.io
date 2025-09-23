import React from "react";
import { className as classNameAnnotation } from "./classname";
import type { Meta, StoryObj } from "@storybook/nextjs";

const ClassnameDemo = () => {
  const Block = classNameAnnotation.Block as any;
  return (
    <Block annotation={{ query: "bg-blue-500 text-white p-2" }}>
      Sample Block with custom className
    </Block>
  );
};

export default {
  title: "Components/CodeHike/Classname",
  component: ClassnameDemo,
} satisfies Meta<typeof ClassnameDemo>;

type Story = StoryObj<typeof ClassnameDemo>;

export const Default: Story = {
  args: {},
};

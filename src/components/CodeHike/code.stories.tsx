import React from "react";
import { Code } from "./code";
import type { Meta, StoryObj } from "@storybook/react";

const sampleCodeblock = {
  raw: "console.log('Hello, Storybook!');\n",
  lang: "js",
  meta: "example.js",
} as any;

const CodeDemo = () => <Code codeblock={sampleCodeblock} />;

export default {
  title: "Components/CodeHike/Code",
  component: CodeDemo,
} satisfies Meta<typeof CodeDemo>;

type Story = StoryObj<typeof CodeDemo>;

export const Default: Story = {
  args: {},
};

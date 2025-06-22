import React from "react";
// import { Code } from "./code"; // Original component relies on Next.js and CodeHike runtime, which breaks in Storybook.
import type { Meta, StoryObj } from "@storybook/react";

const sampleCodeblock = {
  raw: "console.log('Hello, Storybook!');\n",
  lang: "js",
  meta: "example.js",
} as any;

const CodeDemo = () => (
  <pre className="p-4 bg-gray-100 rounded">
    <code>console.log('Hello, Storybook!');</code>
  </pre>
);

export default {
  title: "Components/CodeHike/Code",
  component: CodeDemo,
} satisfies Meta<typeof CodeDemo>;

type Story = StoryObj<typeof CodeDemo>;

export const Default: Story = {
  args: {},
};

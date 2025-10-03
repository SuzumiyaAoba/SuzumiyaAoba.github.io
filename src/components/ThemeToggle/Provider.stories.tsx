import type { Meta, StoryObj } from "@storybook/react";
import { ThemeProvider } from "./Provider";

const SampleContent = () => (
  <div style={{ padding: "1rem" }}>
    <p>テーマを切り替えてみてください。</p>
  </div>
);

export default {
  title: "Components/ThemeToggle/Provider",
  component: ThemeProvider,
} satisfies Meta<typeof ThemeProvider>;

type Story = StoryObj<typeof ThemeProvider>;

export const Default: Story = {
  args: {
    children: <SampleContent />,
  },
};

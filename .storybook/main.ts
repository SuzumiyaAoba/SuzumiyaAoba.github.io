import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-links",
    "@storybook/addon-onboarding",
    "@storybook/addon-vitest",
  ],
  docs: {
    autodocs: "tag",
  },
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
};
export default config;

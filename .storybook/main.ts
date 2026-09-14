import type { StorybookConfig } from "@storybook/nextjs-vite";

const storybookConfig: StorybookConfig = {
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
  viteFinal(config) {
    if (config.build) {
      config.build.chunkSizeWarningLimit = 5000;
    }
    return {
      ...config,
      build: {
        ...config.build,
        rolldownOptions: {
          ...config.build?.rolldownOptions,
          onLog(_level, warning, log) {
            if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
              return;
            }
            log(_level, warning);
          },
        },
      },
    };
  },
};
export default storybookConfig;

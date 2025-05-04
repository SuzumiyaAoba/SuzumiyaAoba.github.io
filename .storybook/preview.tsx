import type { Preview } from "@storybook/react";

import clsx from "clsx";
import { exo_2, mono as monoFont, zen_maru_gothic } from "../src/styles/fonts";

import "../src/app/globals.css";

export const decorators = [
  (Story) => (
    <div
      className={clsx(
        zen_maru_gothic.className,
        exo_2.variable,
        monoFont.variable,
      )}
    >
      <Story />
    </div>
  ),
];

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;

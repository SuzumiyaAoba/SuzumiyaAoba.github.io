import type { Meta, StoryObj } from "@storybook/nextjs";
import SearchComponent from "./SearchComponent";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

const mockRouter = {
  push: () => {},
  replace: () => {},
  prefetch: () => Promise.resolve(),
  back: () => {},
  forward: () => {},
  refresh: () => {},
  pathname: "/search",
  route: "/search",
  query: {},
  params: {},
  basePath: "",
  asPath: "/search",
  isLocaleDomain: false,
  isPreview: false,
};

export default {
  title: "Components/Search/SearchComponent",
  component: SearchComponent,
  decorators: [
    (Story) => (
      <AppRouterContext.Provider value={mockRouter as any}>
        <Story />
      </AppRouterContext.Provider>
    ),
  ],
} satisfies Meta<typeof SearchComponent>;

type Story = StoryObj<typeof SearchComponent>;

export const Default: Story = {
  args: {},
};

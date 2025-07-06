import type { MDXComponents } from "mdx/types";

declare module "mdx/types" {
  export interface MDXComponents {
    VisDotGraph?: React.ComponentType<{
      dotCode: string;
      width?: string;
      height?: string;
      className?: string;
      options?: {
        physics?: boolean;
        interaction?: boolean;
        navigationButtons?: boolean;
      };
    }>;
  }
} 
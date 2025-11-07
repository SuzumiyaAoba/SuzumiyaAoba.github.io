import type { FC } from "react";

export type Format = "md" | "mdx";

export type RawContent = {
  path: string;
  format: Format;
  raw: string;
};

export type Content<FRONTMATTER> = {
  rawContent: RawContent;
  frontmatter: FRONTMATTER;
  content: string;
  stylesheets: string[];
  Component: FC<unknown>;
  gitHistory?: {
    createdDate: string | null;
    lastModified: string | null;
    repoUrl: string | null;
    filePath: string | null;
  };
};

export type ParsedContent<FRONTMATTER> = {
  format: Format;
  data: { [key: string]: unknown };
  frontmatter: FRONTMATTER;
  content: string;
};

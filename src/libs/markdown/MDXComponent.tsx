import { FC } from "react";

export type MDXComponent = (params: {
  paths: string[];
  format: "md" | "mdx";
  scope: { [key: string]: unknown };
  source: string;
}) => FC<unknown>;

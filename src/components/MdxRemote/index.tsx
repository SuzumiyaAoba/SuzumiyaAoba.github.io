"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { FC } from "react";

export const MdxRemote: FC<
  MDXRemoteSerializeResult<Record<string, unknown>, Record<string, unknown>>
> = (mdxSource) => {
  return <MDXRemote {...mdxSource} />;
};

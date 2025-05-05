"use client";

import { useEffect } from "react";

type StylesheetLoaderProps = {
  stylesheets: string[];
  basePath: string;
  slug: string | string[];
};

export function StylesheetLoader({
  stylesheets,
  basePath,
  slug,
}: StylesheetLoaderProps) {
  useEffect(() => {
    if (!stylesheets.length) return;

    const slugPath = Array.isArray(slug) ? slug.join("/") : slug;
    const createdLinks: HTMLLinkElement[] = [];

    stylesheets.forEach((fileName) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `/assets/${basePath}/${slugPath}/${fileName}`;
      document.head.appendChild(link);
      createdLinks.push(link);
    });

    return () => {
      createdLinks.forEach((link) => link.remove());
    };
  }, [stylesheets, basePath, slug]);

  return null;
}

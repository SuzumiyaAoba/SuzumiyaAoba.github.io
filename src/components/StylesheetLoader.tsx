"use client";

import { useEffect } from "react";

export function StylesheetLoader({
  stylesheets,
  basePath,
  slug,
}: {
  stylesheets: string[];
  basePath: string;
  slug: string | string[];
}) {
  useEffect(() => {
    const slugPath = Array.isArray(slug) ? slug.join("/") : slug;

    stylesheets.forEach((fileName) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `/assets/${basePath}/${slugPath}/${fileName}`;
      document.head.appendChild(link);
    });

    return () => {
      stylesheets.forEach((fileName) => {
        const links = document.querySelectorAll(
          `link[href="/assets/${basePath}/${slugPath}/${fileName}"]`
        );
        links.forEach((link) => link.remove());
      });
    };
  }, [stylesheets, basePath, slug]);

  return null;
}

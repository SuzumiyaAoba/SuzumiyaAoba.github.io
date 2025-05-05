"use client";

import { useEffect } from "react";

export function StylesheetLoader({
  stylesheets,
  slug,
}: {
  stylesheets: string[];
  slug: string;
}) {
  useEffect(() => {
    stylesheets.forEach((fileName) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `/assets/blog/${slug}/${fileName}`;
      document.head.appendChild(link);
    });

    return () => {
      stylesheets.forEach((fileName) => {
        const links = document.querySelectorAll(
          `link[href="/assets/blog/${slug}/${fileName}"]`
        );
        links.forEach((link) => link.remove());
      });
    };
  }, [stylesheets, slug]);

  return null;
}

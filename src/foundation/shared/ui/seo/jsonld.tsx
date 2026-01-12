import type { ReactElement } from "react";

export function JsonLd({ data }: { data: Record<string, unknown> }): ReactElement {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is required for SEO.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

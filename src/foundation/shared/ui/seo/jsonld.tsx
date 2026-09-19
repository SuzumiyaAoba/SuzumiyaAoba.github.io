import type { ReactElement } from "react";

export function JsonLd({
  data,
}: {
  data: Record<string, unknown>;
}): ReactElement {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is required for SEO.
      // <, >, & を Unicode エスケープ済み(ルールが推奨する方式)。
      // 検出器は replaceAll チェーンを sanitize と認識しないため抑制する。
      // react-doctor-disable-next-line unsafe-json-in-html
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
          .replaceAll("&", String.raw`\u0026`)
          .replaceAll("<", String.raw`\u003c`)
          .replaceAll(">", String.raw`\u003e`),
      }}
    />
  );
}

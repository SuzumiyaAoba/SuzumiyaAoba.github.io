import { memo } from "hono/jsx";
import type { FC } from "hono/jsx";

import type { DeepReadonly } from "ts-essentials";

const GoogleFonts: FC<{
  fonts: DeepReadonly<
    {
      name: string;
      weight: number[];
    }[]
  >;
}> = memo(({ fonts }) => {
  const familyQuery = fonts
    .map((font) => {
      const weight = font.weight.join(";");
      return `family=${encodeURI(font.name)}${
        weight === "" ? "" : `:wght@${weight}`
      }`;
    })
    .join("&");

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        Crossorigin={true}
      />
      <link
        href={`https://fonts.googleapis.com/css2?${familyQuery}&display=swap`}
        rel="preload"
        as="style"
      />
      <link
        href={`https://fonts.googleapis.com/css2?${familyQuery}&display=swap`}
        rel="stylesheet"
        media="print"
        onload="this.media='all'"
      />
    </>
  );
});

export default GoogleFonts;

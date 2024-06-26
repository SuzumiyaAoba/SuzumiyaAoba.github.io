import { css } from "hono/css";
import type { FC } from "hono/jsx";

export const Programming: FC<{
  height: string;
  width: string;
}> = ({ width, height }) => {
  const style = css`
    .avocado_een       { fill:#231F20; }
    .avocado_twee      { fill:#3D3935; }
    .avocado_negentien { fill:#E0A838; }
    .avocado_twintig   { fill:#EAD13F; }
    .avocado_acht      { fill:#A3AEB5; }
    .avocado_zeven     { fill:#788287; }
    .avocado_tien      { fill:#C3CC6A; }
`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Programming"
      class={style}
    >
      <rect x="0.5" y="4.5" class="avocado_twee" width="31" height="21" />
      <path
        class="avocado_acht"
        d="M0.5,4.5v21h13v4h6v-4h12v-21H0.5z M30,24H2V6h28V24z"
      />{" "}
      <rect x="13.5" y="25.5" class="avocado_zeven" width="6" height="1.5" />
      <path
        class="avocado_een"
        d="M32,26V4H0v22h13v3h-1v1h9v-1h-1v-3H32z M1,25V5h30v20H1z M19,29h-5v-3h5V29z"
      />
      <path
        class="avocado_tien"
        d="M9,10H6V9h3V10z M7,11v1h3v-1H7z M7,18h3v-1H7V18z M6,20h3v-1H6V20z"
      />
      <path class="avocado_negentien" d="M22,13v1H8v-1H22z M8,16h14v-1H8V16z" />
      <path class="avocado_twintig" d="M17,12h-6v-1h6V12z M21,9H10v1h11V9z" />
    </svg>
  );
};

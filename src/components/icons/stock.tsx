import type { FC } from "hono/jsx";

export const Stock: FC<{
  height: string;
  width: string;
}> = ({ width, height }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      height={height}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="stock"
    >
      <rect width="48" height="48" fill="white" fill-opacity="0.01" />
      <rect
        x="6"
        y="16"
        width="8"
        height="16"
        fill="#2F88FF"
        stroke="#000000"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path
        d="M10 6V16"
        stroke="#000000"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M10 32V42"
        stroke="#000000"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <rect
        x="34"
        y="16"
        width="8"
        height="16"
        fill="#2F88FF"
        stroke="#000000"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path
        d="M38 6V16"
        stroke="#000000"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M38 32V42"
        stroke="#000000"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <rect
        x="20"
        y="14"
        width="8"
        height="16"
        fill="#2F88FF"
        stroke="#000000"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path
        d="M24 4V14"
        stroke="#000000"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M24 30V40"
        stroke="#000000"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

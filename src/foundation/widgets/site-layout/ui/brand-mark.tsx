/**
 * サイトの印。サイト名「偽からは何でも導かれる」にちなみ、「ゆえに」を表す ∴ を図案化している。
 */
export function BrandMark({
  className = "brand-mark",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="6.5" r="2.25" />
      <circle cx="5.75" cy="17.5" r="2.25" />
      <circle cx="18.25" cy="17.5" r="2.25" />
    </svg>
  );
}

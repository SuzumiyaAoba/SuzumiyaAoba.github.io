export function Arrow({ className = "" }: { className?: string }) {
  return (
    <span className={`home-arrow ${className}`} aria-hidden="true">
      ↗
    </span>
  );
}

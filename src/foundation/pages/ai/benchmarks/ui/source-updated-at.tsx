export function SourceUpdatedAt({ value }: { value: string | null }) {
  return value === null ? "未公表" : <time dateTime={value}>{value}</time>;
}

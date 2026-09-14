const LINE_NUMBERS_PATTERN = /(?:^|\s)line-numbers=(true|false)(?=\s|$)/gu;

export function parseCodeMeta(meta?: string): {
  displayMeta: string;
  showLineNumbers: boolean;
} {
  let showLineNumbers = true;
  const displayMeta = (meta ?? "")
    .replace(LINE_NUMBERS_PATTERN, (_, value: string) => {
      showLineNumbers = value === "true";
      return " ";
    })
    .replaceAll(/\s+/gu, " ")
    .trim();

  return { displayMeta, showLineNumbers };
}

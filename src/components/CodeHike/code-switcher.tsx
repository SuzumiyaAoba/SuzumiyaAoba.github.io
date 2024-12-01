import { RawCode, highlight } from "codehike/code";

import { LanguageSwitcher } from "./language-switcher";

export async function CodeSwitcher(props: { code: RawCode[] }) {
  const highlighted = await Promise.all(
    props.code.map((codeblock) => highlight(codeblock, "github-light"))
  );

  return <LanguageSwitcher highlighted={highlighted} />;
}

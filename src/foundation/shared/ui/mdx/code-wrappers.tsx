import type { PropsWithChildren } from "react";

export function CodeWithTabs({ children }: PropsWithChildren) {
  return <div className="space-y-4">{children}</div>;
}

export function CodeSwitcher({ children }: PropsWithChildren) {
  return <div className="space-y-4">{children}</div>;
}

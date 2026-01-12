import type { ReactNode } from "react";

export type TabProps = {
  title: string;
  children: ReactNode;
};

export function Tab({ title, children }: TabProps) {
  return <div data-tab-title={title}>{children}</div>;
}

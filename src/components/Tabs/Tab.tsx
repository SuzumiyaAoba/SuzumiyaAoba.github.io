import { ReactNode } from "react";

export type TabProps = {
  title: string;
  children: ReactNode;
};

export const Tab: React.FC<TabProps> = ({ title, children }) => {
  return <div data-tab-title={title}>{children}</div>;
};

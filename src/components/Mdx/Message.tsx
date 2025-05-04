import { FC, PropsWithChildren } from "react";

export const Message: FC<
  PropsWithChildren<{
    title?: string;
  }>
> = ({ title, children }) => {
  return (
    <aside className="my-8 px-4 rounded-md border border-sky-400 bg-sky-50">
      {title &&
        (
          <div className="flex pt-4">
            <div className="i-mdi-info mr-2 text-2xl text-sky-800" />
            <div className="font-bold">{title}</div>
          </div>
        )}
      {children}
    </aside>
  );
};

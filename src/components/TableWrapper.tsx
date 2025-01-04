import { FC, PropsWithChildren } from "react";

export const TableWrapper: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="overflow-x-scroll">
      <table>{children}</table>
    </div>
  );
};

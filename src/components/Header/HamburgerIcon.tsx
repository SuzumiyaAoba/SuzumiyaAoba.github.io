"use client";

import { type FC } from "react";
import clsx from "clsx";

export const HamburgerIcon: FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const lineClass =
    "block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out";

  return (
    <>
      <span
        className={clsx(
          lineClass,
          isOpen ? "rotate-45" : "-translate-y-2"
        )}
      />
      <span
        className={clsx(
          lineClass,
          isOpen ? "opacity-0" : ""
        )}
      />
      <span
        className={clsx(
          lineClass,
          isOpen ? "-rotate-45" : "translate-y-2"
        )}
      />
    </>
  );
}; 
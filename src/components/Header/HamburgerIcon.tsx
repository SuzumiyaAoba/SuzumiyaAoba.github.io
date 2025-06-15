"use client";

import { type FC } from "react";
import clsx from "clsx";

/**
 * ハンバーガーメニューアイコン
 *
 * メニューの開閉状態（isOpen）に応じて、三本線から「×」印にアニメーションします。
 *
 * @param {{ isOpen: boolean }} props - コンポーネントのプロパティ
 * @param {boolean} props.isOpen - メニューが開いているかどうか
 */
export const HamburgerIcon: FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const lineClass =
    "block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out";

  return (
    <>
      <span
        aria-hidden="true"
        className={clsx(
          lineClass,
          isOpen ? "rotate-45" : "-translate-y-2"
        )}
      />
      <span
        aria-hidden="true"
        className={clsx(
          lineClass,
          isOpen ? "opacity-0" : ""
        )}
      />
      <span
        aria-hidden="true"
        className={clsx(
          lineClass,
          isOpen ? "-rotate-45" : "translate-y-2"
        )}
      />
    </>
  );
}; 
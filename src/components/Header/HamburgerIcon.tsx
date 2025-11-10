import { type FC } from "react";
import { Icon } from "@iconify/react";

/**
 * ハンバーガーメニューアイコン
 *
 * メニューの開閉状態（isOpen）に応じて、メニューアイコンから「×」印に切り替わります。
 *
 * @param {{ isOpen: boolean }} props - コンポーネントのプロパティ
 * @param {boolean} props.isOpen - メニューが開いているかどうか
 */
export const HamburgerIcon: FC<{ isOpen: boolean }> = ({ isOpen }) => {
  return (
    <Icon
      icon={isOpen ? "lucide:x" : "lucide:menu"}
      width={24}
      height={24}
      style={{ color: "currentColor" }}
      className="transition-transform duration-300 ease-in-out"
    />
  );
};

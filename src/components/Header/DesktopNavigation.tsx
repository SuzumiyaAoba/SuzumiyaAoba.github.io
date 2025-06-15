"use client";

import { type FC } from "react";
import Link from "next/link";
import { MENUS } from "./menu";

type NavigationProps = {
  menus: typeof MENUS;
};

export const DesktopNavigation: FC<NavigationProps> = ({ menus }) => (
  <ul className="flex items-center space-x-6">
    {menus.map((menu) => (
      <li key={menu.name}>
        <Link
          href={menu.href}
          className="text-sm font-medium transition-colors hover:text-primary"
        >
          {menu.name}
        </Link>
      </li>
    ))}
  </ul>
); 
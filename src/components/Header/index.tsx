"use client";

import type { FC } from "react";
import Link from "next/link";
import clsx from "clsx";
import { exo_2 } from "@/fonts";

const menus = [
  {
    name: "Blog",
    href: "/",
  },
  {
    name: "Notes",
    href: "/notes/",
  },
] satisfies { name: string; href: string }[];

export const Header: FC<{
  siteName: string;
}> = ({ siteName }) => {
  return (
    <>
      <header className="w-full py-3">
        <div className="flex max-w-4xl px-4 mx-auto items-center">
          <Link href={"/"} className={clsx("text-2xl", exo_2.className)}>
            {siteName}
          </Link>
          <nav className="ml-8">
            <ul className="flex gap-8">
              {menus.map((menu) => (
                <li key={menu.href}>
                  <Link href={menu.href} className="px-2">
                    {menu.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <div className="border-0.5 border-neutral-200 drop-shadow-md" />
    </>
  );
};

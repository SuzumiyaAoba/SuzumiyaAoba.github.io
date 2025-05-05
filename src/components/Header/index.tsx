"use client";

import type { FC } from "react";
import Link from "next/link";
import clsx from "clsx";
import { exo_2 } from "@/fonts";

// メニュー項目を定数として定義
const MENUS = [
  { name: "Blog", href: "/blog/" },
  { name: "Notes", href: "/notes/" },
  { name: "Tools", href: "/tools/" },
  { name: "Keywords", href: "/keywords/" },
] as const;

type HeaderProps = {
  siteName: string;
};

export const Header: FC<HeaderProps> = ({ siteName }) => {
  return (
    <>
      <header className="w-full py-3">
        <div className="flex max-w-4xl px-4 mx-auto items-center">
          <SiteLogo siteName={siteName} />
          <Navigation menus={MENUS} />
        </div>
      </header>
      <div className="border-0.5 border-neutral-200 drop-shadow-md" />
    </>
  );
};

type SiteLogoProps = {
  siteName: string;
};

const SiteLogo: FC<SiteLogoProps> = ({ siteName }) => (
  <Link href={"/"} className={clsx("text-2xl", exo_2.className)}>
    {siteName}
  </Link>
);

type NavigationProps = {
  menus: readonly { name: string; href: string }[];
};

const Navigation: FC<NavigationProps> = ({ menus }) => (
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
);

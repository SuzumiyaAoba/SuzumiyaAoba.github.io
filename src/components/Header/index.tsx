import type { FC } from "react";
import styles from "./styles.module.scss";
import Link from "next/link";

export const Header: FC<{
  siteName: string;
}> = ({ siteName }) => {
  return (
    <header className={styles.header}>
      <Link href={"/"} className={styles.title}>
        {siteName}
      </Link>
      <nav className={styles.nav}>
        <ul className={styles.menus}>
          <li className={styles.menu}>
            <Link href="/">Home</Link>
          </li>
          <li className={styles.menu}>
            <Link href="/notes/">Notes</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

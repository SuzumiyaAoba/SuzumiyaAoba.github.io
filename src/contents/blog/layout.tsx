import styles from "@/styles/markdown.module.scss";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <article className={styles.markdown}>{children}</article>;
}

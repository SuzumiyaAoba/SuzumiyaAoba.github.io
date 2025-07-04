import { FC } from "react";
import Link from "next/link";
import { FooterAds } from "../Ads/FooterAds";

type PoweredBy =
  | {
      name: string;
      url: string;
    }
  | string;

type FooterProps = {
  copyright: string;
  poweredBy: PoweredBy;
};

/**
 * サイト全体のフッターコンポーネント
 *
 * コピーライト情報、プライバシーポリシーやお問い合わせへのリンクを表示します。
 *
 * @param {FooterProps} props - コンポーネントのプロパティ
 * @param {string} props.copyright - コピーライトの所有者名
 * @param {PoweredBy} props.poweredBy - "Powered by" の情報（文字列またはリンクオブジェクト）
 */
export const Footer: FC<FooterProps> = ({ copyright, poweredBy }) => {
  const currentYear = new Date().getFullYear();
  const linkStyles = "transition-colors duration-200 hover:text-foreground";

  return (
    <>
      <FooterAds />
      <footer
        className="flex flex-col font-light items-center mt-auto pt-8 pb-8"
        style={{
          backgroundColor: "var(--background-secondary)",
          borderTop: "1px solid var(--border)",
          color: "var(--muted)",
          boxShadow: "0 -4px 12px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div className="flex gap-x-6 mb-4">
          <Link
            className={linkStyles}
            style={{ color: "var(--muted)" }}
            href="/privacy-policy/"
          >
            プライバシーポリシー
          </Link>
          <Link
            className={linkStyles}
            style={{ color: "var(--muted)" }}
            href="/contact"
          >
            お問い合わせ
          </Link>
          <Link
            className={linkStyles}
            style={{ color: "var(--muted)" }}
            href="/rss.xml"
          >
            RSS
          </Link>
        </div>
        <div className="text-sm text-center">
          <div>
            &copy; {currentYear} {copyright}
          </div>
          <div>
            Powered by{" "}
            {typeof poweredBy === "string" ? (
              poweredBy
            ) : (
              <Link
                href={poweredBy.url}
                className="hover:underline text-blue-400 transition-colors hover:text-blue-300"
              >
                {poweredBy.name}
              </Link>
            )}
          </div>
        </div>
      </footer>
    </>
  );
};

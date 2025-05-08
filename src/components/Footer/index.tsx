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

export const Footer: FC<FooterProps> = ({ copyright, poweredBy }) => {
  const date = new Date();
  const currentYear = date.getFullYear();

  const renderPoweredBy = () => {
    if (typeof poweredBy === "string") {
      return poweredBy;
    }

    return (
      <Link
        href={poweredBy.url}
        className="hover:underline text-blue-400 transition-colors hover:text-blue-300"
      >
        {poweredBy.name}
      </Link>
    );
  };

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
          <a
            className="transition-colors duration-200 hover:text-foreground"
            style={{ color: "var(--muted)" }}
            href="/privacy-policy/"
          >
            プライバシーポリシー
          </a>
          <a
            className="transition-colors duration-200 hover:text-foreground"
            style={{ color: "var(--muted)" }}
            href="/contact"
          >
            お問い合わせ
          </a>
        </div>
        <div className="text-sm">
          <div>
            &copy; {currentYear} {copyright}
          </div>
          <div>Powered by {renderPoweredBy()}</div>
        </div>
      </footer>
    </>
  );
};

import { FC } from "react";
import Link from "next/link";
import { FooterAds } from "../ads/FooterAds";

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
      <Link href={poweredBy.url} className="hover:underline">
        {poweredBy.name}
      </Link>
    );
  };

  return (
    <>
      <FooterAds />
      <footer className="flex flex-col font-light items-center mt-auto pt-8 pb-8 bg-gray-100">
        <div className="flex gap-x-6 mb-4">
          <a className="hover:underline" href="/privacy-policy/">
            プライバシーポリシー
          </a>
          <a className="hover:underline" href="/contact">
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

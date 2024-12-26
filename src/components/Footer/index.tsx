import { FC } from "react";
import Link from "next/link";
import { FooterAds } from "../Ads/FooterAds";

export const Footer: FC<{
  copyright: string;
  poweredBy:
    | {
        name: string;
        url: string;
      }
    | string;
}> = ({ copyright, poweredBy }) => {
  const date = new Date();

  return (
    <>
      {/* <FooterAds /> */}
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
            &copy; {date.getFullYear()} {copyright}
          </div>
          <div>
            Powered by{" "}
            {poweredBy instanceof Object ? (
              <Link href={poweredBy.url} className="hover:underline">
                {poweredBy.name}
              </Link>
            ) : (
              poweredBy
            )}
          </div>
        </div>
      </footer>
    </>
  );
};

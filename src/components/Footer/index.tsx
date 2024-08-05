import { FC } from "react";
import Link from "next/link";

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
    <footer className="flex flex-col font-light items-center mt-auto py-8">
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
    </footer>
  );
};

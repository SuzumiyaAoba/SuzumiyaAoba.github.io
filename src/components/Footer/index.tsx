import { FC } from "react";
import styles from "./styles.module.scss";
import Link from "next/link";

/*
<VStack alignItems={"center"} fontWeight={300}>
        <Text mt={0}>
          &copy; {date.getFullYear()} {copyright}
        </Text>
        <Text mt={"0"}>
          Powered by{" "}
          {poweredBy instanceof Object ? (
            <Link
              href={poweredBy.url}
              className={css`
                color: t("colors.link");
              `}
              textDecoration={"none"}
              _hover={{ textDecoration: "underline" }}
            >
              {poweredBy.name}
            </Link>
          ) : (
            poweredBy
          )}
        </Text>
      </VStack>
*/

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
    <footer className={styles.footer}>
      <div>
        &copy; {date.getFullYear()} {copyright}
      </div>
      <div>
        Powered by{" "}
        {poweredBy instanceof Object ? (
          <Link href={poweredBy.url}>{poweredBy.name}</Link>
        ) : (
          poweredBy
        )}
      </div>
    </footer>
  );
};

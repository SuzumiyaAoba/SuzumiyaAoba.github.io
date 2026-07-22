import type { Metadata } from "next";
import BooksPage from "@/pages/books/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Books",
  alternates: buildLocaleAlternates("/books", "ja", { availability: { ja: true } }),
};

export default function Page() {
  return <BooksPage />;
}

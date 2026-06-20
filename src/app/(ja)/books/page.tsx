import type { Metadata } from "next";
import BooksPage from "@/pages/books/index";

export const metadata: Metadata = {
  title: "Books",
};

export default function Page() {
  return <BooksPage />;
}

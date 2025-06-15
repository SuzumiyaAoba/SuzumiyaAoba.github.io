import { Metadata } from "next";
import config from "@/config";
import { getFrontmatters } from "@/libs/contents/markdown";
import { frontmatterSchema } from "@/libs/contents/notes";
import { sortPostsByDate } from "@/libs/contents/utils";
import { PostList } from "@/components/ui/PostList";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Notes | ${config.metadata.title}`,
  };
}

const getNotes = (path: string[]) =>
  getFrontmatters({
    paths: path,
    schema: frontmatterSchema,
  });

export default async function NotesPage() {
  const scalaNotes = await getNotes(["notes", "programming", "scala"]);
  const bookNotes = await getNotes(["notes", "programming", "books"]);

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl">Notes</h1>

      <PostList
        title="Scala"
        basePath="notes/programming/scala"
        posts={sortPostsByDate(scalaNotes)}
        variant="list"
      />

      <PostList
        title="Books"
        basePath="notes/programming/books"
        posts={sortPostsByDate(bookNotes)}
        variant="list"
      />
    </main>
  );
}

import fs from "fs";
import path from "path";

const POSTS_FOLDER = path.join(process.cwd(), "src/contents/blog");

export default function Home() {
  const blogs = fs.readdirSync(POSTS_FOLDER);

  return (
    <main>
      <h1>タイトル</h1>
      <div>
        {blogs.map((blog) => {
          return (
            <div key={blog}>
              <a href={`/blog/${blog}/`}>{blog}</a>
            </div>
          );
        })}
      </div>
    </main>
  );
}

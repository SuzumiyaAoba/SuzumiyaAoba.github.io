import { expect, it } from "vite-plus/test";
import { renderToStaticMarkup } from "react-dom/server";
import { compileMDX } from "./compile-mdx";

it("resolves imported JSON through the build-time scope", async () => {
  const { content } = await compileMDX({
    source: 'import data from "./data.json";\n\n{data.title}',
    options: { scope: { data: { title: "Scoped title" } } },
  });
  expect(renderToStaticMarkup(content)).toContain("Scoped title");
});

it("keeps import statements inside code examples", async () => {
  const { content } = await compileMDX({
    source: '```js\nimport data from "./data.json";\n```',
  });
  expect(renderToStaticMarkup(content)).toContain(
    "import data from &quot;./data.json&quot;;"
  );
});

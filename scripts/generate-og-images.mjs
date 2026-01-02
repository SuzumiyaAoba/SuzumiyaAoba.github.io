import fs from "fs/promises";
import path from "path";
import React from "react";
import satori from "satori";
import matter from "gray-matter";
import fg from "fast-glob";

const OG_IMAGE_SIZE = { width: 1200, height: 630 };

const THEME = {
  primaryColor: "#3B82F6",
  accentColor: "#06B6D4",
  bgColor: "#0F172A",
  textColor: "#F8FAFC",
  lightTextColor: "#94A3B8",
};

const NOTO_SANS_JP_PATH = path.join(
  process.cwd(),
  "node_modules",
  "@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff",
);

async function loadConfig() {
  const configPath = path.join(process.cwd(), "src", "config.ts");
  const raw = await fs.readFile(configPath, "utf8");
  const match = raw.match(/export default\s+(\{[\s\S]*?\})\s*satisfies/);
  if (!match) {
    throw new Error("Failed to parse src/config.ts");
  }
  // eslint-disable-next-line no-new-func
  const config = new Function(`return ${match[1]}`)();
  return config;
}

function OgBaseLayout({ children }) {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        width: "100%",
        height: "100%",
        padding: "0",
        background:
          "linear-gradient(125deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
        fontFamily: '"Noto Sans JP", Inter, system-ui, sans-serif',
      },
    },
    children,
  );
}

function TopBar({ title, date }) {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "24px 40px",
        background:
          "linear-gradient(90deg, rgba(59,130,246,0.8) 0%, rgba(6,182,212,0.8) 100%)",
        color: "white",
      },
    },
    React.createElement(
      "div",
      { style: { fontSize: "24px", fontWeight: "bold", letterSpacing: "-0.025em" } },
      title,
    ),
    date
      ? React.createElement("div", { style: { fontSize: "18px" } }, date)
      : null,
  );
}

function CategoryTag({ category }) {
  return React.createElement(
    "div",
    {
      style: {
        display: "block",
        padding: "8px 16px",
        background: `linear-gradient(90deg, ${THEME.primaryColor} 0%, ${THEME.accentColor} 100%)`,
        color: "white",
        borderRadius: "9999px",
        fontSize: "18px",
        fontWeight: "600",
        marginBottom: "24px",
        width: "auto",
      },
    },
    category,
  );
}

function Title({ title }) {
  return React.createElement(
    "div",
    {
      style: {
        fontSize: "56px",
        fontWeight: "800",
        lineHeight: 1.2,
        marginBottom: "24px",
        color: THEME.textColor,
        letterSpacing: "-0.05em",
        maxWidth: "90%",
        overflow: "hidden",
      },
    },
    title,
  );
}

function Footer({ author, url }) {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: THEME.lightTextColor,
      },
    },
    React.createElement(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "8px" } },
      React.createElement(
        "div",
        {
          style: {
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${THEME.primaryColor} 0%, ${THEME.accentColor} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "16px",
          },
        },
        author[0],
      ),
      React.createElement(
        "div",
        { style: { fontSize: "18px", fontWeight: "500" } },
        author,
      ),
    ),
    React.createElement(
      "div",
      { style: { fontSize: "16px", fontWeight: "500" } },
      url.replace(/^https?:\/\//, ""),
    ),
  );
}

function DecorationBar() {
  return React.createElement("div", {
    style: {
      width: "120px",
      height: "8px",
      background: `linear-gradient(90deg, ${THEME.primaryColor} 0%, ${THEME.accentColor} 100%)`,
      borderRadius: "4px",
      marginTop: "auto",
      marginBottom: "24px",
    },
  });
}

async function renderBlogOg({ title, category, date, fontData, siteTitle, author, url }) {
  return satori(
    React.createElement(
      OgBaseLayout,
      null,
      React.createElement(TopBar, { title: siteTitle, date }),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            padding: "40px",
            flex: 1,
          },
        },
        React.createElement(CategoryTag, { category }),
        React.createElement(Title, { title }),
        React.createElement(DecorationBar, null),
        React.createElement(Footer, { author, url }),
      ),
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}

async function renderHomeOg({ fontData, siteTitle, description, author, url }) {
  return satori(
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "0",
          background:
            "linear-gradient(125deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
          fontFamily: '"Noto Sans JP", Inter, system-ui, sans-serif',
          overflow: "hidden",
          position: "relative",
        },
      },
      React.createElement("div", {
        style: {
          position: "absolute",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${THEME.primaryColor}15 0%, ${THEME.accentColor}10 100%)`,
          top: "-400px",
          right: "-200px",
        },
      }),
      React.createElement("div", {
        style: {
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${THEME.primaryColor}10 0%, ${THEME.accentColor}05 100%)`,
          bottom: "-300px",
          left: "-100px",
        },
      }),
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "40px",
            maxWidth: "800px",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              fontSize: "88px",
              fontWeight: "900",
              color: THEME.textColor,
              letterSpacing: "-0.05em",
              marginBottom: "16px",
            },
          },
          siteTitle,
        ),
        React.createElement("div", {
          style: {
            width: "180px",
            height: "10px",
            background: `linear-gradient(90deg, ${THEME.primaryColor} 0%, ${THEME.accentColor} 100%)`,
            borderRadius: "5px",
            margin: "24px 0",
          },
        }),
        React.createElement(
          "div",
          {
            style: {
              fontSize: "28px",
              lineHeight: "1.5",
              fontWeight: "500",
              color: THEME.lightTextColor,
              maxWidth: "700px",
              marginBottom: "32px",
            },
          },
          description,
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "20px",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(30, 41, 59, 0.7)",
                padding: "12px 24px",
                borderRadius: "9999px",
              },
            },
            React.createElement(
              "div",
              {
                style: {
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${THEME.primaryColor} 0%, ${THEME.accentColor} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "18px",
                },
              },
              author[0],
            ),
            React.createElement(
              "div",
              { style: { fontSize: "20px", fontWeight: "600", color: THEME.textColor } },
              url.replace(/^https?:\/\//, ""),
            ),
          ),
        ),
      ),
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}

async function writeSvg(filePath, svg) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, svg, "utf8");
}

async function main() {
  const config = await loadConfig();
  const { title: siteTitle, description, url, author } = config.metadata;
  const fontData = await fs.readFile(NOTO_SANS_JP_PATH);

  // ホームOGP
  const homeSvg = await renderHomeOg({
    fontData,
    siteTitle,
    description,
    author,
    url,
  });
  await writeSvg(path.join(process.cwd(), "public", "opengraph-image.svg"), homeSvg);

  // ブログ記事OGP
  const entries = await fg(["src/contents/blog/*/index.mdx"], { dot: false });
  for (const entry of entries) {
    const raw = await fs.readFile(entry, "utf8");
    const { data } = matter(raw);
    if (data?.ogImage) {
      continue;
    }

    const slug = path.basename(path.dirname(entry));
    const date = data?.date
      ? new Date(data.date).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : undefined;

    const svg = await renderBlogOg({
      title: data?.title ?? "Blog Post",
      category: data?.category ?? "Blog",
      date,
      fontData,
      siteTitle,
      author,
      url,
    });

    const outPath = path.join(
      process.cwd(),
      "public",
      "blog",
      "post",
      slug,
      "opengraph-image.svg",
    );
    await writeSvg(outPath, svg);
  }

  // eslint-disable-next-line no-console
  console.log(`Generated OGP images: home + ${entries.length} posts`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

import { describe, expect, it } from "vite-plus/test";

import { parseLinkCardMetadata } from "./parse-ogp";

describe("parseLinkCardMetadata", () => {
  it("og:title と og:description を優先する", () => {
    const html = `<html><head>
      <title>ページ名 | サイト</title>
      <meta name="description" content="通常の説明">
      <meta property="og:title" content="OGP の題">
      <meta property="og:description" content="OGP の説明">
    </head><body></body></html>`;

    expect(parseLinkCardMetadata(html)).toStrictEqual({
      title: "OGP の題",
      description: "OGP の説明",
    });
  });

  it("og:title がなければ twitter:title、<title> の順に使う", () => {
    expect(
      parseLinkCardMetadata(
        `<head><title>T</title><meta name="twitter:title" content="X"></head>`
      )
    ).toStrictEqual({ title: "X" });
    expect(
      parseLinkCardMetadata(`<head><title>\n  T  \n</title></head>`)
    ).toStrictEqual({ title: "T" });
  });

  it("属性の順序や引用符の種類に依らず読み、実体参照と空白を整える", () => {
    const html = `<head>
      <meta content='A &amp; B &#x3042; &#12356;' property='og:title'>
      <meta content=bare name=description>
    </head>`;

    expect(parseLinkCardMetadata(html)).toStrictEqual({
      title: "A & B あ い",
      description: "bare",
    });
  });

  it("属性値の中に > があってもタグを途中で切らない", () => {
    const html = `<head>
      <meta property="og:title" content="Tips > tricks">
      <title>T</title>
      <meta name="description" content="1 > 0 の話">
    </head>`;

    expect(parseLinkCardMetadata(html)).toStrictEqual({
      title: "Tips > tricks",
      description: "1 > 0 の話",
    });
  });

  it("題によく現れる名前付きの実体参照を復号し、未知の名前や不正な数値参照はそのまま残す", () => {
    expect(
      parseLinkCardMetadata(
        `<head><title>A &mdash; B&hellip; &unknown; &#xD800; &#0;</title></head>`
      )
    ).toStrictEqual({ title: "A — B… &unknown; &#xD800; &#0;" });
  });

  it("</head> より後の meta は読まない", () => {
    const html = `<head><title>T</title></head><body><meta name="description" content="本文中"></body>`;

    expect(parseLinkCardMetadata(html)).toStrictEqual({ title: "T" });
  });

  it("タイトルが見つからなければ null を返す", () => {
    expect(
      parseLinkCardMetadata(
        `<head><meta name="description" content="d"></head>`
      )
    ).toBeNull();
    expect(parseLinkCardMetadata(`<head><title>  </title></head>`)).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { extractAmazonProductIdsFromMdx } from "./amazon-product-ids";

describe("extractAmazonProductIdsFromMdx", () => {
  it("配列形式のidsを抽出する", () => {
    const source = `<AmazonProductSection ids={["B001", "B002"]} />`;
    expect(extractAmazonProductIdsFromMdx(source)).toEqual(["B001", "B002"]);
  });

  it("文字列形式のidを抽出する", () => {
    const source = `<AmazonProductSection ids="B001" />`;
    expect(extractAmazonProductIdsFromMdx(source)).toEqual(["B001"]);
  });

  it("重複したidは1つにまとめる", () => {
    const source = `
      <AmazonProductSection ids={["B001", "B001"]} />
      <AmazonProductSection ids="B001" />
    `;
    expect(extractAmazonProductIdsFromMdx(source)).toEqual(["B001"]);
  });

  it("AmazonProductSectionが無ければ空配列を返す", () => {
    expect(extractAmazonProductIdsFromMdx("# hello world")).toEqual([]);
  });

  it("複数のAmazonProductSectionからidsを集約する", () => {
    const source = `
      <AmazonProductSection ids={["B001"]} />
      本文...
      <AmazonProductSection ids={["B002", "B003"]} />
    `;
    expect(extractAmazonProductIdsFromMdx(source)).toEqual(["B001", "B002", "B003"]);
  });
});

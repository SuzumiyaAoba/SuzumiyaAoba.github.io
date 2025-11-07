import { describe, expect, it } from "vitest";
import { parseRawContent } from "@/libs/contents/parser";
import { blogFrontmatterSchema } from "@/libs/contents/schema";
import type { RawContent } from "@/libs/contents/types";

describe("parser", () => {
  describe("parseRawContent", () => {
    it("should parse valid frontmatter", () => {
      const rawContent: RawContent = {
        path: "test/path",
        format: "md",
        raw: `---
title: Test Post
date: 2024-01-01
category: test
tags:
  - tag1
  - tag2
---

# Test Content

This is test content.`,
      };

      const result = parseRawContent(blogFrontmatterSchema, rawContent);

      expect(result).not.toBeNull();
      expect(result?.frontmatter.title).toBe("Test Post");
      expect(result?.frontmatter.category).toBe("test");
      expect(result?.frontmatter.tags).toEqual(["tag1", "tag2"]);
      expect(result?.content).toContain("# Test Content");
    });

    it("should return null for invalid frontmatter", () => {
      const rawContent: RawContent = {
        path: "test/path",
        format: "md",
        raw: `---
title: Test Post
---

Content without required fields`,
      };

      const result = parseRawContent(blogFrontmatterSchema, rawContent);

      expect(result).toBeNull();
    });

    it("should handle content without frontmatter", () => {
      const rawContent: RawContent = {
        path: "test/path",
        format: "md",
        raw: "# Just content\n\nNo frontmatter here.",
      };

      const result = parseRawContent(blogFrontmatterSchema, rawContent);

      expect(result).toBeNull();
    });
  });
});

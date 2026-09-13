import { parse } from "yaml";
import { z } from "zod";

const textSchema = z.string().trim().min(1);
const httpUrlSchema = z
  .string()
  .trim()
  .pipe(z.url({ protocol: /^https?$/ }));
const relatedUrlSchema = z.union([
  httpUrlSchema,
  z
    .string()
    .trim()
    .regex(/^\/(?!\/)[^\\\s]*$/, "サイト内の URL は / から始めてください。"),
]);

function optionalUrl(value: unknown) {
  return value === null || (typeof value === "string" && value.trim() === "") ? undefined : value;
}

function linkSchema(url: typeof httpUrlSchema | typeof relatedUrlSchema) {
  return z.preprocess(
    (value) => (typeof value === "string" ? { url: value } : value),
    z.strictObject({ url, title: textSchema.optional() }),
  );
}

const awesomeItemSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: textSchema,
  category: textSchema,
  tags: z
    .array(textSchema)
    .nullish()
    .transform((value) => [...new Set(value ?? [])]),
  description: textSchema,
  websiteUrl: z.preprocess(optionalUrl, httpUrlSchema.optional()),
  githubUrl: z.preprocess(optionalUrl, httpUrlSchema.optional()),
  articles: z
    .array(linkSchema(httpUrlSchema))
    .nullish()
    .transform((value) => value ?? []),
  relatedPosts: z
    .array(linkSchema(relatedUrlSchema))
    .nullish()
    .transform((value) => value ?? []),
});

const awesomeSourceSchema = z.strictObject({
  items: z.array(awesomeItemSchema).superRefine((items, context) => {
    const ids = new Set<string>();
    items.forEach((item, index) => {
      if (ids.has(item.id)) {
        context.addIssue({
          code: "custom",
          path: [index, "id"],
          message: `ID が重複しています: ${item.id}`,
        });
      }
      ids.add(item.id);
    });
  }),
});

export type AwesomeItem = z.infer<typeof awesomeItemSchema>;
export type AwesomeLink = AwesomeItem["articles"][number];

export function parseAwesomeItems(source: string): AwesomeItem[] {
  try {
    return awesomeSourceSchema.parse(parse(source)).items;
  } catch (error) {
    const detail =
      error instanceof z.ZodError
        ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")
        : error instanceof Error
          ? error.message
          : String(error);
    throw new Error(`awesome-something.yaml の形式が不正です。\n${detail}`, { cause: error });
  }
}

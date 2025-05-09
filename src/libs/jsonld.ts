import config from "@/config";

type BlogPostingProps = {
  title: string;
  date: string | Date;
  tags: string[];
  description?: string;
  author?: string;
  url?: string;
};

export function createBlogPostingJsonLd({
  title,
  date,
  tags,
  description,
  author = config.metadata.author,
  url,
}: BlogPostingProps) {
  const isoDate =
    typeof date === "string"
      ? new Date(date).toISOString()
      : date.toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    datePublished: isoDate,
    dateModified: isoDate,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: config.metadata.title,
      logo: {
        "@type": "ImageObject",
        url: `${config.metadata.url}/favicon.ico`,
      },
    },
    description: description || title,
    keywords: tags.join(","),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url || `${config.metadata.url}`,
    },
  };
}

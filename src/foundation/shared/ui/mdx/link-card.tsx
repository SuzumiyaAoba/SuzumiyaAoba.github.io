import { getLinkCard } from "@/shared/lib/mdx/link-card/link-cards";

/**
 * リンクカードのプロパティ
 */
export type LinkCardProps = {
  /** リンク先の URL（http または https） */
  url: string;
  /** 題。省略すると content/link-cards.json の値、なければホスト名を表示する */
  title?: string;
  /** 要約。省略すると content/link-cards.json の値を表示する */
  description?: string;
};

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

function parseHttpUrl(url: string): URL {
  if (URL.canParse(url)) {
    const parsed = new URL(url);
    if (HTTP_PROTOCOLS.has(parsed.protocol)) {
      return parsed;
    }
  }
  throw new Error(
    `LinkCard の url には http(s) の URL を指定してください: ${url}`
  );
}

/**
 * 外部ページへのリンクを、題・要約・ホスト名の枠で表示するコンポーネント。
 * 題と要約は content/link-cards.json から引く（scripts/fetch-link-cards.mjs が生成）。
 * 未登録の URL でもビルドは止めず、ホスト名だけで表示する。
 */
export async function LinkCard({ url, title, description }: LinkCardProps) {
  const { hostname } = parseHttpUrl(url);
  const card = await getLinkCard(url);
  const heading = title ?? card?.title ?? hostname;
  const summary = description ?? card?.description;

  return (
    <a
      className="link-card"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="link-card-title">{heading}</span>
      {summary ? (
        <span className="link-card-description">{summary}</span>
      ) : null}
      <span className="link-card-host">{hostname}</span>
    </a>
  );
}

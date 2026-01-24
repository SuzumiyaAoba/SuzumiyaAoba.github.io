/**
 * GitHub のコードへのリンクを表示するためのプロパティ
 */
export type GitHubCodeLinkProps = {
  /** GitHub のリポジトリ内のファイルまたはディレクトリの URL */
  url: string;
  /** 表示するパスから除外するディレクトリ階層の数 */
  skipPath?: number;
};

/**
 * GitHub のリポジトリ内のコードへのリンクを表示するコンポーネント。
 * URL からリポジトリ名を除いた相対パスを抽出して表示します。
 */
export function GitHubCodeLink({ url, skipPath = 0 }: GitHubCodeLinkProps) {
  const urlPath = url.replace("https://github.com/", "");
  const [, , , , ...rest] = urlPath.split("/");

  return (
    <div className="my-4 text-center text-sm">
      <a
        href={url}
        className="underline underline-offset-4"
        target="_blank"
        rel="noopener noreferrer"
      >
        {rest.slice(skipPath).join("/")}
      </a>
    </div>
  );
}

export type GitHubCodeLinkProps = {
  url: string;
  skipPath?: number;
};

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

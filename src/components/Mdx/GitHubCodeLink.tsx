import { FC } from "react";

export const GitHubCodeLink: FC<{ url: string; skipPath?: number }> = ({
  url,
  skipPath = 0,
}) => {
  const urlPath = url.replace("https://github.com/", "");
  const [_owner, _repo, _, _branch, ...rest] = urlPath.split("/");

  return (
    <center>
      <a href={url} style={{ fontSize: "0.85rem" }}>
        {rest.slice(skipPath).join("/")}
      </a>
    </center>
  );
};

import { FC } from "react";

const tagToIcon = (tag: string) => {
  switch (tag.toLowerCase()) {
    case "java":
      return "i-skill-icons-java-light mr-1.5";
    case "astro":
      return "i-skill-icons-astro mr-1.5";
    case "nix":
      return "i-skill-icons-nix-light mr-1.5";
    case "tmux":
      return "i-codicon-terminal-tmux mr-1.5";
    case "プログラミング":
      return "i-hugeicons-computer-programming-01 mr-1.5"
  }

  return "i-material-symbols:tag-rounded";
};

export const Tag: FC<{ label: string }> = ({ label: tag }) => {
  return (
    <div className="flex items-center px-2 py-0.5 border border-neutral-400 rounded-md bg-neutral-100">
      <span className={`${tagToIcon(tag)}`} />
      <span>{tag}</span>
    </div>
  );
};

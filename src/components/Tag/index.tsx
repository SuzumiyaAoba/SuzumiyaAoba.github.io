import { FC } from "react";

const tagToIcon = (tag: string) => {
  switch (tag.toLowerCase()) {
    case "java":
      return "i-skill-icons-java-light mr-1.5";
    case "scala":
      return "i-devicon-scala mr-1.5";
    case "astro":
      return "i-skill-icons-astro mr-1.5";
    case "next.js":
      return "i-devicon-nextjs mr-1.5";
    case "nix":
      return "i-skill-icons-nix-light mr-1.5";
    case "tmux":
      return "i-codicon-terminal-tmux mr-1.5";
    case "emacs":
      return "i-logos-emacs mr-1.5";
    case "ollama":
      return "i-simple-icons-ollama mr-1.5";
    case "プログラミング":
      return "i-material-symbols-code-blocks-outline mr-1";
  }

  return "i-material-symbols:tag-rounded";
};

export const Tag: FC<{ label: string }> = ({ label: tag }) => {
  return (
    <div className="flex items-center px-2 py-0.5 border border-neutral-400 rounded-md bg-neutral-100">
      <span className={tagToIcon(tag)} />
      <span>{tag}</span>
    </div>
  );
};

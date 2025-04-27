import { FC } from "react";

export const TAG_LABELS = [
  "java",
  "scala",
  "astro",
  "next.js",
  "nix",
  "tmux",
  "emacs",
  "ollama",
  "プログラミング",
] as const;

type TagLabel = (typeof TAG_LABELS)[number];

const toTypedTagLabel = (tag: string): TagLabel | undefined =>
  TAG_LABELS.find((it) => it === tag);

const tagToIcon = (tag: string) => {
  switch (toTypedTagLabel(tag.toLowerCase())) {
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

export const Tag: FC<{ label: string }> = ({ label }) => {
  return (
    <span className="flex w-fit break-keep items-center px-2 py-0.5 border border-neutral-400 rounded-md bg-neutral-100">
      <span className={tagToIcon(label)} />
      <span>{label}</span>
    </span>
  );
};

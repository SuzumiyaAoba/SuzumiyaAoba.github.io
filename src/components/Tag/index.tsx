import { FC } from "react";

const tagToIcon = (tag: string) => {
  switch (tag.toLowerCase()) {
    case "java":
      return "i-skill-icons-java-light mr-1.5";
    case "astro":
      return "i-skill-icons-astro mr-1.5";
  }

  return "i-material-symbols:tag-rounded";
};

export const Tag: FC<{ label: string }> = ({ label: tag }) => {
  return (
    <div className="flex items-center px-2 py-0.5 border border-slate-300 rounded-2xl">
      <span className={`${tagToIcon(tag)} text-xl`} />
      <span>{tag}</span>
    </div>
  );
};

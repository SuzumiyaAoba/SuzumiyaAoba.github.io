import clsx from "clsx";

const languageToIcon = (lang: string) => {
  console.log(lang);
  switch (lang.toLocaleLowerCase()) {
    case "javascript":
      return "i-skill-icons-javascript";
    case "css":
      return "i-skill-icons-css";
    case "python":
      return "i-skill-icons-python-light";
    case "java":
      return "i-skill-icons-java-light";
    case "scala":
      return "i-skill-icons-scala-light";
    case "kotlin":
      return "i-skill-icons-kotlin-light";
    case "cpp":
      return "i-skill-icons-cpp";
    case "go":
      return "i-skill-icons-golang";
    case "rust":
      return "i-skill-icons-rust";
    case "swift":
      return "i-skill-icons-swift";
    case "fsharp":
      return "i-skill-icons-dotnet";
    case "matlab":
      return "i-skill-icons-matlab-light";
    case "shellscript":
      return "i-skill-icons-powershell-light";
  }
};

export function LanguageIcon({
  lang,
  className,
}: {
  lang: string;
  className?: string;
}) {
  return <span className={clsx(languageToIcon(lang), className)} />;
}

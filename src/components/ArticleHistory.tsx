import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Icon } from "@iconify/react";

interface ArticleHistoryProps {
  createdDate?: string;
  lastModified?: string;
  filePath?: string;
  repoUrl?: string;
  className?: string;
}

export function ArticleHistory({
  createdDate,
  lastModified,
  filePath,
  repoUrl,
  className = "",
}: ArticleHistoryProps) {
  if (!createdDate && !lastModified) {
    return null;
  }

  // GitHubの変更履歴へのURL
  const historyUrl = repoUrl && filePath
    ? `${repoUrl}/commits/master/${filePath}`
    : null;

  return (
    <div
      className={`border rounded-lg p-4 ${className}`}
      style={{
        backgroundColor: "var(--background-secondary)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="flex items-center gap-2 text-lg font-semibold mb-3"
        style={{ color: "var(--foreground)" }}
      >
        <Icon icon="lucide:calendar" width={20} height={20} style={{ color: "currentColor" }} />
        記事履歴
      </div>

      <div className="space-y-2">
        {createdDate && (
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            <strong>作成:</strong>{" "}
            {format(new Date(createdDate), "yyyy年M月d日", { locale: ja })}
          </div>
        )}
        {lastModified && lastModified !== createdDate && (
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            <strong>最終更新:</strong>{" "}
            {format(new Date(lastModified), "yyyy年M月d日", { locale: ja })}
          </div>
        )}

        {historyUrl && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <a
              href={historyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm hover:underline transition-colors duration-200"
              style={{ color: "var(--accent-primary)" }}
            >
              <Icon icon="octicon:history-16" width={16} height={16} />
              GitHubで変更履歴を見る
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 
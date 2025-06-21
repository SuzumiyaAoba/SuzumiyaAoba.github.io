import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { GitCommit } from "@/libs/git-history";
import { Clock, GitCommit as GitCommitIcon, User } from "lucide-react";

interface ArticleHistoryProps {
  history: GitCommit[];
  createdDate?: string;
  lastModified?: string;
  repoUrl?: string;
  className?: string;
}

export function ArticleHistory({
  history,
  createdDate,
  lastModified,
  repoUrl,
  className = "",
}: ArticleHistoryProps) {
  if (history.length === 0 && !createdDate && !lastModified) {
    return null;
  }

  return (
    <details className={`border rounded-lg bg-gray-50 dark:bg-gray-900 ${className}`}>
      <summary className="flex items-center gap-2 text-lg font-semibold p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-lg">
        <Clock size={20} />
        記事履歴
      </summary>
      <div className="p-4 pt-0">

      {/* 作成日・最終更新日の概要 */}
      {(createdDate || lastModified) && (
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border">
          {createdDate && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>作成:</strong>{" "}
              {format(new Date(createdDate), "yyyy年M月d日", { locale: ja })}
            </div>
          )}
          {lastModified && lastModified !== createdDate && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>最終更新:</strong>{" "}
              {format(new Date(lastModified), "yyyy年M月d日", { locale: ja })}
            </div>
          )}
        </div>
      )}

      {/* 詳細な更新履歴 */}
      {history.length > 0 && (
        <div>
          <div className="text-md font-medium mb-3 text-gray-700 dark:text-gray-300">
            更新履歴（直近{Math.min(history.length, 10)}件）
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {history.slice(0, 10).map((commit) => (
              <div
                key={commit.hash}
                className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border"
              >
                <GitCommitIcon size={16} className="mt-0.5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {commit.message}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {commit.author}
                    </span>
                    <span>
                      {format(new Date(commit.date), "yyyy/M/d HH:mm", {
                        locale: ja,
                      })}
                    </span>
                    {repoUrl ? (
                      <a
                        href={`${repoUrl}/commit/${commit.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                      >
                        {commit.hash.substring(0, 7)}
                      </a>
                    ) : (
                      <span className="font-mono text-xs">
                        {commit.hash.substring(0, 7)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {history.length > 10 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              他 {history.length - 10} 件の更新履歴があります
            </div>
          )}
        </div>
      )}
      </div>
    </details>
  );
} 
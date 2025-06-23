import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { GitCommit } from "@/libs/git-history";

// プロパティを受け取るSVGアイコン
const CalendarIcon = ({ size = 20, ...props }: { size?: number; [key: string]: any }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    {...props}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const GitIcon = ({ size = 16, ...props }: { size?: number; [key: string]: any }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    {...props}
  >
    <circle cx="12" cy="12" r="4" />
    <line x1="1.05" y1="12" x2="7" y2="12" />
    <line x1="17.01" y1="12" x2="22.96" y2="12" />
  </svg>
);

const UserIcon = ({ size = 12, ...props }: { size?: number; [key: string]: any }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    {...props}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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
    <details 
      className={`border rounded-lg ${className}`}
      style={{
        backgroundColor: "var(--background-secondary)",
        borderColor: "var(--border)",
      }}
    >
      <summary 
        className="flex items-center gap-2 text-lg font-semibold p-4 cursor-pointer rounded-t-lg transition-colors duration-200 hover:opacity-80"
        style={{ color: "var(--foreground)" }}
      >
        <CalendarIcon size={20} style={{ color: "currentColor" }} />
        記事履歴
      </summary>
      <div className="p-4 pt-0">
        {/* 作成日・最終更新日の概要 */}
        {(createdDate || lastModified) && (
          <div 
            className="mb-4 p-3 rounded border"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
            }}
          >
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
          </div>
        )}

        {/* 詳細な更新履歴 */}
        {history.length > 0 && (
          <div>
            <div 
              className="text-md font-medium mb-3"
              style={{ color: "var(--foreground)" }}
            >
              更新履歴（直近{Math.min(history.length, 10)}件）
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {history.slice(0, 10).map((commit) => (
                <div
                  key={commit.hash}
                  className="flex items-start gap-3 p-3 rounded border"
                  style={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                  }}
                >
                  <GitIcon 
                    size={16} 
                    className="mt-0.5" 
                    style={{ color: "var(--muted)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      {commit.message}
                    </div>
                    <div 
                      className="flex items-center gap-3 mt-1 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      <span className="flex items-center gap-1">
                        <UserIcon size={12} style={{ color: "currentColor" }} />
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
                          className="font-mono text-xs hover:underline transition-colors duration-200"
                          style={{ 
                            color: "var(--accent-primary)",
                          }}
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
              <div 
                className="mt-2 text-xs text-center"
                style={{ color: "var(--muted)" }}
              >
                他 {history.length - 10} 件の更新履歴があります
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  );
} 
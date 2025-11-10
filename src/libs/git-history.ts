import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";

export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author: string;
}

/**
 * GitHubリポジトリのURLを取得
 */
export function getGitHubRepoUrl(): string | null {
  try {
    // リモートのorigin URLを取得
    const remoteUrl = execSync("git config --get remote.origin.url", {
      encoding: "utf8",
    }).trim();

    if (!remoteUrl) {
      return null;
    }

    // SSH形式 (git@github.com:user/repo.git または ssh://git@github.com/user/repo.git) を HTTPS形式に変換
    if (remoteUrl.startsWith("git@github.com:")) {
      const repoPath = remoteUrl
        .replace("git@github.com:", "")
        .replace(/\.git$/, "");
      return `https://github.com/${repoPath}`;
    }

    // SSH with ssh:// prefix 形式を HTTPS形式に変換
    if (remoteUrl.startsWith("ssh://git@github.com/")) {
      const repoPath = remoteUrl
        .replace("ssh://git@github.com/", "")
        .replace(/\.git$/, "");
      return `https://github.com/${repoPath}`;
    }

    // HTTPS形式 (https://github.com/user/repo.git) からGitHubのURLを抽出
    if (remoteUrl.startsWith("https://github.com/")) {
      return remoteUrl.replace(/\.git$/, "");
    }

    return null;
  } catch (error) {
    console.error("Error getting GitHub repo URL:", error);
    return null;
  }
}

/**
 * 指定されたファイルのgit履歴を取得
 */
export function getFileGitHistory(filePath: string): GitCommit[] {
  try {
    // ファイルが存在するかチェック
    if (!existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return [];
    }

    // gitリポジトリのルートディレクトリを取得
    const gitRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf8",
    }).trim();

    // 相対パスに変換
    const relativePath = path.relative(gitRoot, filePath);

    // git logコマンドでファイルの履歴を取得
    const gitLog = execSync(
      `git log --follow --pretty=format:"%H|%ai|%s|%an" -- "${relativePath}"`,
      {
        encoding: "utf8",
        cwd: gitRoot,
      },
    );

    if (!gitLog.trim()) {
      return [];
    }

    // ログを解析してCommitオブジェクトの配列に変換
    const commits = gitLog
      .trim()
      .split("\n")
      .map((line) => {
        const [hash, date, message, author] = line.split("|");
        return {
          hash: hash.trim(),
          date: new Date(date.trim()).toISOString(),
          message: message.trim(),
          author: author.trim(),
        };
      })
      .filter((commit) => commit.hash && commit.date);

    return commits;
  } catch (error) {
    console.error(`Error getting git history for ${filePath}:`, error);
    return [];
  }
}

/**
 * ファイルの最初のコミット日（作成日）を取得
 */
export function getFileCreationDate(filePath: string): string | null {
  try {
    const history = getFileGitHistory(filePath);
    if (history.length === 0) {
      return null;
    }

    // 最後のコミット（最初の作成）の日付を返す
    return history[history.length - 1].date;
  } catch (error) {
    console.error(`Error getting file creation date for ${filePath}:`, error);
    return null;
  }
}

/**
 * ファイルの最後の更新日を取得
 */
export function getFileLastModified(filePath: string): string | null {
  try {
    const history = getFileGitHistory(filePath);
    if (history.length === 0) {
      return null;
    }

    // 最初のコミット（最新の更新）の日付を返す
    return history[0].date;
  } catch (error) {
    console.error(
      `Error getting file last modified date for ${filePath}:`,
      error,
    );
    return null;
  }
}

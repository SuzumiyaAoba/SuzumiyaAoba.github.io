import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { Arrow } from "./home-arrow";
import type { HomeNote } from "../model/home-content";

type HomeLibraryProps = { locale: Locale; notes: HomeNote[] };

export function HomeLibrary({ locale, notes }: HomeLibraryProps) {
  const en = locale === "en";
  const t = (ja: string, english: string) => (en ? english : ja);
  const tools = [
    {
      href: "/tools/ascii-standard-code",
      name: t("ASCII コード表", "ASCII reference"),
      description: t(
        "文字コードとビットの対応表",
        "Character codes and their binary values"
      ),
    },
    {
      href: "/tools/asset-formation-simulator",
      name: t("資産形成シミュレーター", "Savings simulator"),
      description: t(
        "積立額・利回り・期間から資産の推移を計算",
        "Calculate growth from contributions, return, and duration"
      ),
    },
  ];

  return (
    <section
      className="home-library site-container"
      aria-labelledby="library-title"
    >
      <div>
        <div className="home-section-heading">
          <h2 id="library-title" className="home-section-title">
            {t("ノート", "Notes")}
          </h2>
          <a href={toLocalePath("/notes", locale)} className="home-inline-link">
            {t("すべて", "All notes")}
            <Arrow />
          </a>
        </div>
        {notes.length > 0 ? (
          <ul className="home-note-list">
            {notes.slice(0, 4).map((note) => (
              <li key={note.slug}>
                <a href={toLocalePath(`/notes/${note.slug}`, locale)}>
                  <span>{note.title}</span>
                  <Arrow />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="home-empty">
            {t("ノートはまだありません。", "No notes yet.")}
          </p>
        )}
        <a href="/books/" hrefLang="ja" className="home-books-link">
          <span>{t("書籍一覧", "Books (Japanese)")}</span>
          <Arrow />
        </a>
      </div>
      <aside className="home-toolbox" aria-labelledby="toolbox-title">
        <h2 id="toolbox-title" className="home-section-title">
          {t("ツール", "Tools")}
        </h2>
        <ul>
          {tools.map((tool) => (
            <li key={tool.href}>
              <a href={toLocalePath(tool.href, locale)}>
                <span>
                  <strong>{tool.name}</strong>
                  <span className="home-tool-description">
                    {tool.description}
                  </span>
                </span>
                <Arrow />
              </a>
            </li>
          ))}
        </ul>
        <a href={toLocalePath("/archive", locale)} className="home-inline-link">
          {t("資料とツールの一覧", "Archive")}
          <Arrow />
        </a>
      </aside>
    </section>
  );
}

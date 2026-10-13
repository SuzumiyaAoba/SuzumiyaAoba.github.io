type SiteLockupProps = {
  /** 表示の大きさ。sm はヘッダー、md はフッター、lg はホームの冒頭。 */
  size?: "sm" | "md" | "lg";
  /** 横線の右に規則名 sequitur を添えるかどうか。小さな表示では省き「ex falso quodlibet」と読ませる。 */
  showRule?: boolean;
};

/**
 * サイト名のロゴタイプ。「Ex falso sequitur quodlibet（偽からは何でも導かれる）」を
 * 自然演繹の推論図として組む。前提 Ex falso を線の上、結論 quodlibet を線の下に置き、
 * 推論の名前にあたる sequitur を線の右端に添える。朱の横線がサイトの印になる。
 *
 *     Ex falso
 *   ─────────── sequitur
 *    quodlibet
 */
export function SiteLockup({ size = "sm", showRule = false }: SiteLockupProps) {
  return (
    <span className="site-lockup" data-size={size} lang="la">
      <span className="site-lockup-premise">Ex falso</span>
      <span className="site-lockup-line" aria-hidden="true" />
      {showRule ? (
        <span className="site-lockup-rule"> sequitur </span>
      ) : (
        <span className="sr-only"> sequitur </span>
      )}
      <span className="site-lockup-conclusion">quodlibet</span>
    </span>
  );
}

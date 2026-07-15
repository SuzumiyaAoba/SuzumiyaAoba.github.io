export type ChartSectionProps = {
  title: string;
  /** 次のセクションとの間隔を空けるかどうか(最後のセクションはfalseにする) */
  marginBottom?: boolean;
  children: React.ReactNode;
};

/**
 * 1ファイルに複数チャートを並べるラッパー(Section26/28/32など)の共通コンテナ。
 * 見出し(h4)+チャート本体のペアを描画するだけで、チャートの種類・データ加工は
 * 呼び出し側にそのまま残す。
 */
export function ChartSection({ title, marginBottom = false, children }: ChartSectionProps) {
  return (
    <div style={marginBottom ? { marginBottom: "2rem" } : undefined}>
      <h4>{title}</h4>
      {children}
    </div>
  );
}

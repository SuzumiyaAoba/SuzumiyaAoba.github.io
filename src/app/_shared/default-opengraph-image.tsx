import { SITE_TITLE } from "@/shared/lib/site/site-title";
import { renderOpengraphImage } from "./opengraph-image";
export { OPENGRAPH_IMAGE_SIZE as DEFAULT_OPENGRAPH_IMAGE_SIZE } from "./opengraph-image";

/**
 * サイトルート用の既定 OGP 画像を描画する。ja/en で完全に共通。
 */
export function renderDefaultOpengraphImage() {
  return renderOpengraphImage(
    <div
      style={{
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px",
        fontFamily: '"Shippori Mincho"',
      }}
    >
      <div
        style={{
          fontSize: 100,
          fontWeight: 700,
          color: "#18181b",
          textAlign: "center",
        }}
      >
        {SITE_TITLE}
      </div>
      <div
        style={{
          marginTop: "40px",
          fontSize: 40,
          color: "#71717a",
        }}
      >
        suzumiyaaoba.com
      </div>
    </div>,
  );
}

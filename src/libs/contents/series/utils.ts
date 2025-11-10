/**
 * シリーズ名から自動的にslugを生成
 * 日本語の場合はbase64urlエンコード、英数字の場合はケバブケースに変換
 */
export function generateSlugFromSeriesName(seriesName: string): string {
  // 英数字と一部の記号のみの場合はケバブケースに変換
  if (/^[a-zA-Z0-9\s\-_.]+$/.test(seriesName)) {
    return seriesName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
  }

  // 日本語などの多バイト文字を含む場合はbase64urlエンコード
  return encodeSeriesName(seriesName);
}

/**
 * シリーズ名をURLセーフなbase64文字列にエンコード
 * 静的エクスポート時のファイルシステム互換性のため
 * Node.jsとブラウザの両方で動作
 */
export function encodeSeriesName(seriesName: string): string {
  let base64: string;

  // Node.js環境 (サーバーサイド)
  if (typeof Buffer !== "undefined") {
    base64 = Buffer.from(seriesName, "utf-8").toString("base64");
  }
  // ブラウザ環境 (クライアントサイド)
  else {
    // UTF-8エンコード後、base64エンコード
    const utf8Bytes = new TextEncoder().encode(seriesName);
    const binaryString = Array.from(utf8Bytes, (byte) =>
      String.fromCharCode(byte),
    ).join("");
    base64 = btoa(binaryString);
  }

  // '+' → '-', '/' → '_' に置換、末尾の '=' を削除 (URLセーフ)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * base64urlエンコードされた文字列をシリーズ名にデコード
 * Node.jsとブラウザの両方で動作
 */
export function decodeSeriesName(encoded: string): string {
  // URLセーフな形式 → 標準base64に戻す
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");

  // パディングを追加
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }

  // Node.js環境 (サーバーサイド)
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("utf-8");
  }
  // ブラウザ環境 (クライアントサイド)
  else {
    // base64デコード後、UTF-8デコード
    const binaryString = atob(base64);
    const utf8Bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      utf8Bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(utf8Bytes);
  }
}

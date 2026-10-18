# オーディオの3D表示

- `ui/scene/texture-sources/` はテクスチャの生成元。通常のクライアントバンドルからは読み込まない。
- `npm run build:audio-textures` で画像と `audio-textures.json` を再生成する。初回は `npx playwright install chromium` が必要。別の Chromium は `AUDIO_TEXTURE_BROWSER` で指定できる。
- `npm run check:audio-textures` は生成元のハッシュと配信用画像を検証する。通常の dev/build でも実行し、ブラウザーは不要。
- 初回は128px幅の軽量画像で描画し、その後に元の解像度の可逆WebPへ更新する。詳細画像の取得失敗時も軽量画像で操作を続ける。
- 製品タブは同じキャンバスとレンダラーを使い、直近2製品のシーンを保持する。キャッシュから外れたシーンとページ離脱時のGPU資源は解放する。
- HD 800 Sのグリルと繊維は、画面上の大きさに応じて詳細形状を遅延生成する。`detail-levels.ts` のヒステリシスで境界の点滅を防ぐ。詳細形状は製品シーンと同じ寿命で解放する。

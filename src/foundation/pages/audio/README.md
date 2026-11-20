# オーディオの3D表示

- 3D ビューアーと機器タブは `src/foundation/shared/ui/audio/`、機器情報とモデルの型はその `definitions/` に配置する。オーディオページと MDX で同じ実装を使う。
- `src/foundation/shared/ui/audio/scene/texture-sources/` はテクスチャの生成元。通常のクライアントバンドルからは読み込まない。
- `npm run build:audio-textures` で画像と `audio-textures.json` を再生成する。初回は `npx playwright install chromium` が必要。別の Chromium は `AUDIO_TEXTURE_BROWSER` で指定できる。
- `npm run check:audio-textures` は生成元のハッシュと配信用画像を検証する。通常の dev/build でも実行し、ブラウザーは不要。
- 初回は幅128px以下の軽量画像で描画し、その後に元の解像度の可逆WebPへ更新する。詳細画像の取得失敗時も軽量画像で操作を続ける。
- 木目・繊維・編組の凹凸は赤チャンネル、粗さや金網の被覆率は緑チャンネルに格納する。同じ画像は機器間でも共有する。HD 800 S の織金網は縦糸と横糸が一巡する64pxのタイルを繰り返す。
- 印字用キャンバスは縦横いずれも指定解像度以内に収める。真空管などの屈折用背景は画面の描画画素数に応じて解像度を調整する。
- 製品タブは同じキャンバスとレンダラーを使い、直近2製品のシーンを保持する。キャッシュから外れたシーンとページ離脱時のGPU資源は解放する。
- 静的な三角形は全頂点属性が一致する場合に索引で共有し、同じ材質の部品をまとめて描画する。旋削部品は半径に応じて円周の分割数を決め、段差や端面の輪郭を保つ。
- HD 800 S のグリルと繊維、Clear Mg のイヤーパッドの繊維は、表示領域と描画画素数に応じて詳細形状を遅延生成する。Clear Mg の通気孔は開口が2画素に達すると内壁も描画する。`detail-levels.ts` のヒステリシスで境界の点滅を防ぐ。詳細形状は製品シーンと同じ寿命で解放する。
- NODE の通気板も拡大時に面取りを含む詳細形状へ切り替える。遠景でも通気穴は実形状として残す。BNC カップリングの軸方向は径とロック溝の境界だけを分割する。

## MDX への埋め込み

記事内では import なしで使用できる。`AudioSystem` は接続全体、`AudioEquipment` は指定した機器の 3D モデルを表示する。回転・ズーム・視点切り替えはオーディオページと共通。埋め込みを使う記事だけでコンポーネントを読み込み、モデルと Three.js は表示領域に近づいてから読み込む。

```mdx
<AudioSystem />

<AudioEquipment model="hd-800s" />

<AudioEquipment model="ie-600" locale="en" />
```

`locale` の既定値は `ja`。英語では `en` を指定する。`model` には次の ID を指定できる。

- `node-n130`
- `ud-505`
- `cg-10m`
- `ha-1a-mk2`
- `sigma-pro`
- `btr17`
- `hd-800s`
- `clear-mg-pro`
- `ie-600`
- `kantof-headphone-stand`
- `audioquest-cinnamon`
- `cybershaft-bnc`

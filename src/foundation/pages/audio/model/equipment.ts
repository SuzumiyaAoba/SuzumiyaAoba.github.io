import type { Locale } from "@/shared/lib/routing";

type LocalizedText = Record<Locale, string>;

export type AudioEquipment = {
  id: string;
  model?: "ud-505" | "cg-10m" | "node-n130" | "hd-800s" | "clear-mg-pro";
  manufacturer: string;
  name: string;
  finish: LocalizedText;
  category: LocalizedText;
  description: LocalizedText;
  details: LocalizedText;
  specifications: { label: LocalizedText; value: LocalizedText }[];
  sources: { title: LocalizedText; href: string }[];
};

/** 所有機器の紹介文と仕様。機器を追加する際はここに追記する。 */
export const audioEquipment: readonly AudioEquipment[] = [
  {
    id: "ud-505",
    model: "ud-505",
    manufacturer: "TEAC",
    name: "UD-505",
    finish: { ja: "シルバー", en: "Silver" },
    category: {
      ja: "USB DAC / ヘッドホンアンプ",
      en: "USB DAC / headphone amplifier",
    },
    description: {
      ja: "デュアルモノーラル構成の USB DAC・ヘッドホンアンプ。左右独立の AK4497 と電源回路を備え、4.4 mm のバランス接続にも対応します。",
      en: "A dual-mono USB DAC and headphone amplifier, with independent AK4497 converters and power supplies for each channel, plus a 4.4 mm balanced headphone output.",
    },
    details: {
      ja: "前面のつまみや端子だけでなく、背面の接続部と底面の3つの脚まで、視点を変えながら確認できます。",
      en: "Explore the machined front controls, rear connections and three pin-point feet from different angles.",
    },
    specifications: [
      {
        label: { ja: "外形寸法", en: "Dimensions" },
        value: {
          ja: "290 × 84.5 × 248.7 mm（幅 × 高さ × 奥行、突起部を含む）",
          en: "290 × 84.5 × 248.7 mm (W × H × D, including protrusions)",
        },
      },
      {
        label: { ja: "質量", en: "Weight" },
        value: { ja: "4.2 kg", en: "4.2 kg" },
      },
      {
        label: { ja: "D/A コンバーター", en: "D/A converters" },
        value: { ja: "AK4497 × 2", en: "2 × AK4497" },
      },
      {
        label: { ja: "USB 入力", en: "USB input" },
        value: {
          ja: "PCM 768 kHz / 32 bit · DSD 22.5 MHz",
          en: "PCM 768 kHz / 32 bit · DSD 22.5 MHz",
        },
      },
      {
        label: { ja: "ヘッドホン出力", en: "Headphone outputs" },
        value: { ja: "4.4 mm × 1 · 6.3 mm × 2", en: "1 × 4.4 mm · 2 × 6.3 mm" },
      },
      {
        label: { ja: "ライン出力", en: "Line outputs" },
        value: { ja: "XLR / RCA", en: "XLR / RCA" },
      },
    ],
    sources: [
      {
        title: { ja: "メーカー製品情報", en: "Manufacturer’s product page" },
        href: "https://teac.jp/jp/product/ud-505/top",
      },
      {
        title: { ja: "取扱説明書", en: "Owner’s manual (Japanese)" },
        href: "https://teac.jp/downloads/products/teac/ud-505/UD-505_OM_J_vB.pdf",
      },
    ],
  },
  {
    id: "cg-10m",
    model: "cg-10m",
    manufacturer: "TEAC",
    name: "CG-10M",
    finish: { ja: "シルバー", en: "Silver" },
    category: {
      ja: "マスタークロックジェネレーター",
      en: "Master clock generator",
    },
    description: {
      ja: "恒温槽付き水晶発振器 TEAC Reference OCXO を搭載した、10 MHz のマスタークロックジェネレーター。4系統の独立した BNC 出力から、対応するオーディオ機器へクロック信号を供給します。",
      en: "A 10 MHz master clock generator with a TEAC Reference OCXO oven-controlled crystal oscillator and four independent BNC outputs for compatible audio equipment.",
    },
    details: {
      ja: "前面の OVEN メーター、背面の金メッキ BNC 端子と照明調整つまみ、側面の持ち手や3点支持の脚まで再現しています。メーターの針は安定時をイメージした静止表示です。",
      en: "Explore the OVEN meter, gold-plated rear BNC outputs, brightness control, side handles and three pin-point feet. The needle is shown in a static, illustrative stabilized position.",
    },
    specifications: [
      {
        label: { ja: "外形寸法", en: "Dimensions" },
        value: {
          ja: "290 × 84.5 × 248.7 mm（幅 × 高さ × 奥行、突起部を含む）",
          en: "290 × 84.5 × 248.7 mm (W × H × D, including protrusions)",
        },
      },
      {
        label: { ja: "質量", en: "Weight" },
        value: { ja: "3.6 kg", en: "3.6 kg" },
      },
      {
        label: { ja: "発振器", en: "Oscillator" },
        value: { ja: "TEAC Reference OCXO", en: "TEAC Reference OCXO" },
      },
      {
        label: { ja: "クロック出力", en: "Clock outputs" },
        value: { ja: "10 MHz · BNC × 4 · 50 Ω", en: "10 MHz · 4 × BNC · 50 Ω" },
      },
      {
        label: { ja: "出力レベル", en: "Output level" },
        value: { ja: "0.5 Vrms（サイン波）", en: "0.5 Vrms (sine wave)" },
      },
      {
        label: { ja: "クロック安定時間", en: "Stabilization time" },
        value: { ja: "約2分", en: "Approximately 2 minutes" },
      },
    ],
    sources: [
      {
        title: { ja: "メーカー製品情報", en: "Manufacturer’s product page" },
        href: "https://teac.jp/jp/product/cg-10m/top",
      },
      {
        title: { ja: "取扱説明書", en: "Owner’s manual (Japanese)" },
        href: "https://teac.jp/downloads/products/teac/cg-10m/CG-10M_OM_J_vB2.pdf",
      },
    ],
  },
  {
    id: "node-n130",
    model: "node-n130",
    manufacturer: "Bluesound",
    name: "NODE (N130)",
    finish: { ja: "ブラック", en: "Black" },
    category: {
      ja: "ワイヤレス・ミュージックストリーマー",
      en: "Wireless music streamer",
    },
    description: {
      ja: "BluOS を搭載したコンパクトなネットワークプレーヤー。最大24 bit / 192 kHz の音源に対応し、既存のオーディオシステムへネットワーク再生を追加できます。",
      en: "A compact BluOS network player with support for audio up to 24-bit/192 kHz, adding network music playback to an existing audio system.",
    },
    details: {
      ja: "マットなブラックの丸い筐体と、光沢のあるタッチパネルを再現。5つのプリセット、音量スライダー、前面の3.5 mm端子、背面の各接続端子を視点を変えて確認できます。LED は点灯状態をイメージした静止表示です。",
      en: "Explore the rounded matte-black enclosure, gloss touch panel with five presets and a volume slider, front 3.5 mm headphone jack and rear connections. The LEDs are shown in a static, illustrative illuminated state.",
    },
    specifications: [
      {
        label: { ja: "外形寸法", en: "Dimensions" },
        value: {
          ja: "220 × 46 × 146 mm（幅 × 高さ × 奥行）",
          en: "220 × 46 × 146 mm (W × H × D)",
        },
      },
      {
        label: { ja: "質量", en: "Weight" },
        value: { ja: "1.09 kg", en: "1.09 kg" },
      },
      {
        label: { ja: "音源の対応", en: "Audio resolution" },
        value: { ja: "最大24 bit / 192 kHz", en: "Up to 24-bit/192 kHz" },
      },
      {
        label: { ja: "ネットワーク", en: "Networking" },
        value: {
          ja: "Wi-Fi 5 · ギガビット Ethernet",
          en: "Wi-Fi 5 · Gigabit Ethernet",
        },
      },
      {
        label: { ja: "入力", en: "Inputs" },
        value: {
          ja: "HDMI eARC · 光 / アナログ（3.5 mm）· USB-A",
          en: "HDMI eARC · optical/analog (3.5 mm) · USB-A",
        },
      },
      {
        label: { ja: "出力", en: "Outputs" },
        value: {
          ja: "RCA · 同軸 / 光デジタル · USB Audio · サブウーファー · 3.5 mmヘッドホン",
          en: "RCA · coaxial/optical digital · USB Audio · subwoofer · 3.5 mm headphones",
        },
      },
    ],
    sources: [
      {
        title: { ja: "製品情報（PDN）", en: "Product information (PDN)" },
        href: "https://pdn.co.jp/bluesound/bs_node.html",
      },
      {
        title: { ja: "取扱説明書", en: "Owner’s manual (Japanese)" },
        href: "https://pdn.co.jp/assets/bluesound/node_dfu.pdf",
      },
    ],
  },
  {
    id: "hd-800s",
    model: "hd-800s",
    manufacturer: "Sennheiser",
    name: "HD 800 S",
    finish: { ja: "マットブラック", en: "Matte black" },
    category: {
      ja: "開放型ヘッドホン",
      en: "Open-back headphones",
    },
    description: {
      ja: "56 mm のリングラジエータートランスデューサーを搭載した開放型ヘッドホン。角度を付けて配置されたドライバーと吸音システムを備え、広い音場と細かな音の再現を目指した設計です。",
      en: "Open-back headphones with 56 mm ring-radiator transducers. Angled drivers and an absorber system are designed for a spacious soundstage and detailed reproduction.",
    },
    details: {
      ja: "蜂の巣状の曲面グリルと奥に見えるドライバー、金属部分の細い溝、布製パッドの毛足と縫い目まで再現。ヘッドバンドの印字や左右の識別表示、着脱端子の継ぎ目も拡大して確認できます。外形と部品寸法は写真からの推定で、ケーブルは表示用に短く描いています。",
      en: "Explore the domed honeycomb grille and recessed driver, fine grooves in the metal baffle, and the fibers and seams of the fabric ear pads. Zoom in on the headband lettering, channel markings and detachable connector details. Exterior and component dimensions are estimated from photos; the cables are shortened for display.",
    },
    specifications: [
      {
        label: { ja: "方式", en: "Transducer principle" },
        value: {
          ja: "ダイナミック・開放型 / オーバーイヤー",
          en: "Dynamic, open-back / over-ear",
        },
      },
      {
        label: { ja: "ドライバー", en: "Drivers" },
        value: {
          ja: "56 mm リングラジエーター",
          en: "56 mm ring radiators",
        },
      },
      {
        label: { ja: "周波数特性", en: "Frequency response" },
        value: { ja: "4 Hz – 51,000 Hz", en: "4 Hz – 51,000 Hz" },
      },
      {
        label: { ja: "インピーダンス", en: "Impedance" },
        value: { ja: "300 Ω", en: "300 Ω" },
      },
      {
        label: { ja: "質量", en: "Weight" },
        value: { ja: "330 g", en: "330 g" },
      },
      {
        label: { ja: "付属ケーブル", en: "Included cables" },
        value: {
          ja: "3 m · 6.35 mm / 4.4 mm バランス（着脱式）",
          en: "3 m · 6.35 mm / balanced 4.4 mm (detachable)",
        },
      },
    ],
    sources: [
      {
        title: { ja: "メーカー製品情報", en: "Manufacturer’s product page" },
        href: "https://jp.sennheiser-hearing.com/ja/products/hd-800-s",
      },
      {
        title: { ja: "メーカー仕様", en: "Manufacturer’s specifications" },
        href: "https://support.sennheiser-hearing.com/hc/en-us/articles/38273432554141-HD-800S-Specifications",
      },
    ],
  },
  {
    id: "clear-mg-pro",
    model: "clear-mg-pro",
    manufacturer: "Focal",
    name: "Clear Mg Professional",
    finish: { ja: "ブラック / レッド", en: "Black / Red" },
    category: {
      ja: "開放型モニターヘッドホン",
      en: "Open-back monitoring headphones",
    },
    description: {
      ja: "40 mm のマグネシウム製M字型ドーム振動板を搭載した、制作・ミックス向けの開放型ヘッドホン。赤いマイクロファイバーパッドと黒いアルミニウム製ヨークを組み合わせた Professional モデルです。",
      en: "Open-back headphones for production and mixing, with 40 mm M-shaped magnesium dome drivers. The Professional model combines red microfiber cushions with black aluminum yokes.",
    },
    details: {
      ja: "外側のハニカムグリル、中央のロゴと円周の刻印、厚さ20 mmの穿孔パッド、革張りヘッドバンドと調整部を再現。ケーブルを外した状態で、左右の3.5 mm端子やパッド内側も確認できます。外形・部品寸法には写真からの推定を含みます。",
      en: "Explore the external honeycomb grilles, central emblems and circular engravings, perforated 20 mm cushions, leather headband and adjustment stems. With the cable detached, both 3.5 mm sockets and the inner pads are visible. Exterior and component dimensions include estimates from photos.",
    },
    specifications: [
      {
        label: { ja: "方式", en: "Design" },
        value: {
          ja: "ダイナミック・開放型 / オーバーイヤー",
          en: "Dynamic, open-back / over-ear",
        },
      },
      {
        label: { ja: "ドライバー", en: "Drivers" },
        value: {
          ja: "40 mm マグネシウム製M字型ドーム",
          en: "40 mm M-shaped magnesium domes",
        },
      },
      {
        label: { ja: "インピーダンス", en: "Impedance" },
        value: { ja: "55 Ω", en: "55 Ω" },
      },
      {
        label: { ja: "感度", en: "Sensitivity" },
        value: {
          ja: "104 dB SPL / 1 mW @ 1 kHz",
          en: "104 dB SPL / 1 mW @ 1 kHz",
        },
      },
      {
        label: {
          ja: "周波数特性（取扱説明書）",
          en: "Frequency response (owner’s manual)",
        },
        value: { ja: "5 Hz – 28 kHz", en: "5 Hz – 28 kHz" },
      },
      {
        label: { ja: "質量", en: "Weight" },
        value: { ja: "450 g", en: "450 g" },
      },
      {
        label: { ja: "付属ケーブル", en: "Included cables" },
        value: {
          ja: "1.2 m ストレート（3.5 mm）/ 5 m カール（6.35 mm）",
          en: "1.2 m straight (3.5 mm) / 5 m coiled (6.35 mm)",
        },
      },
    ],
    sources: [
      {
        title: { ja: "メーカー製品情報", en: "Manufacturer’s product page" },
        href: "https://www.focal.com/products/clear-mg-professional",
      },
      {
        title: { ja: "取扱説明書", en: "Owner’s manual" },
        href: "https://dam.focal-naim.com/m/1d0c79ac3e22c22c/original/UserManual_ClearMGPRO_85x200_web-pdf.pdf",
      },
    ],
  },
];

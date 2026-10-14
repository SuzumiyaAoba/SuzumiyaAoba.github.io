import type { Locale } from "@/shared/lib/routing";
import type { EquipmentModel } from "./viewer";

type LocalizedText = Record<Locale, string>;

export type AudioEquipment = {
  id: string;
  model?: EquipmentModel;
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
      en: "The model includes the rounded matte-black enclosure, gloss touch panel with five presets and a volume slider, front 3.5 mm headphone jack and rear connections. The LEDs are shown in a static, illustrative illuminated state.",
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
      en: "The model includes the OVEN meter, gold-plated rear BNC outputs, brightness control, side handles and three pin-point feet. The needle is shown in a static, illustrative stabilized position.",
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
      en: "The model includes the machined front controls, rear connections and the three pin-point feet underneath.",
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
    id: "ha-1a-mk2",
    model: "ha-1a-mk2",
    manufacturer: "Cayin",
    name: "HA-1A MK2",
    finish: { ja: "シルバー / ウッド", en: "Silver / Wood" },
    category: {
      ja: "真空管ヘッドホンアンプ / プリアンプ",
      en: "Tube headphone amplifier / preamplifier",
    },
    description: {
      ja: "EL84EH、12AU7、12DT5 の計5本の真空管を搭載した、シングルエンド構成のヘッドホンアンプ。5段階のインピーダンス切り替えと2系統の6.35 mmヘッドホン出力を備え、プリアンプとしても使えます。",
      en: "A single-ended headphone amplifier with five vacuum tubes: EL84EH, 12AU7 and 12DT5. It offers five impedance settings, two 6.35 mm headphone outputs and a preamplifier output.",
    },
    details: {
      ja: "艶のある5段の木製側板、ヘアライン仕上げの前面、丸い窓の奥に見える真空管、上面の通気スリットを再現。背面のCD・AUX入力、PRE-OUT、電源端子や底面の3つの脚も確認できます。部品寸法と内部配置は写真からの推定を含み、真空管の光は点灯時をイメージした静止表示です。",
      en: "The model includes the five lacquered wooden side panels, brushed front plate, tubes behind the circular window and open top ventilation slots. Rear CD/AUX inputs, PRE-OUT, power inlet and three supporting feet are also modeled. Component dimensions and internal placement include estimates from photos; the tube glow is a static illustration.",
    },
    specifications: [
      {
        label: { ja: "外形寸法", en: "Dimensions" },
        value: {
          ja: "126.5 × 215 × 304 mm（幅 × 高さ × 奥行）",
          en: "126.5 × 215 × 304 mm (W × H × D)",
        },
      },
      {
        label: { ja: "質量", en: "Weight" },
        value: { ja: "9.5 kg", en: "9.5 kg" },
      },
      {
        label: { ja: "真空管", en: "Vacuum tubes" },
        value: {
          ja: "EL84EH × 2 · 12AU7 × 2 · 12DT5 × 1",
          en: "2 × EL84EH · 2 × 12AU7 · 1 × 12DT5",
        },
      },
      {
        label: { ja: "インピーダンス切り替え", en: "Impedance settings" },
        value: {
          ja: "8–32 / 33–64 / 65–150 / 151–300 / 600 Ω",
          en: "8–32 / 33–64 / 65–150 / 151–300 / 600 Ω",
        },
      },
      {
        label: { ja: "入力", en: "Inputs" },
        value: {
          ja: "RCA × 2系統（CD / AUX）",
          en: "2 × stereo RCA (CD / AUX)",
        },
      },
      {
        label: { ja: "出力", en: "Outputs" },
        value: {
          ja: "6.35 mmヘッドホン × 2 · RCA（PRE-OUT）",
          en: "2 × 6.35 mm headphones · stereo RCA (PRE-OUT)",
        },
      },
    ],
    sources: [
      {
        title: {
          ja: "メーカー製品情報・写真",
          en: "Manufacturer’s product information and photos",
        },
        href: "https://en.cayin.cn/features/7/59/487.html",
      },
      {
        title: { ja: "取扱説明書（英語）", en: "Owner’s manual (English)" },
        href: "https://www.easylounge.com/pdf/Produits/14538c1a-7e24-4221-acc8-c369e48eae80/HA-1A%20MK2%20manual%20%28English%29%20230V-50Hz-Cayin-V1.1.pdf",
      },
    ],
  },
  {
    id: "sigma-pro",
    model: "sigma-pro",
    manufacturer: "Questyle",
    name: "SIGMA Pro",
    finish: { ja: "ブラック", en: "Black" },
    category: {
      ja: "ポータブル DAC / ヘッドホンアンプ",
      en: "Portable DAC / headphone amplifier",
    },
    description: {
      ja: "ESS ES9069Q を2基、フルディスクリートの電流モードアンプを4基搭載したポータブル DAC・ヘッドホンアンプ。USB と Bluetooth に対応し、3種類のヘッドホン出力を備えます。",
      en: "A portable DAC and headphone amplifier with dual ESS ES9069Q converters and four discrete Current Mode amplifier stages. It supports USB and Bluetooth playback and offers three headphone outputs.",
    },
    details: {
      ja: "梨地のブラックアルミ、透明ガラスと縁のドット、4つのアンプ回路、DAC・USB回路、抵抗・コンデンサー、はんだと配線を立体形状で再現。ロゴ・基板の印字・画面表示も文字の輪郭から作った形状です。中空端子、溝付きの音量つまみ、丸みのある操作ボタンも拡大して確認できます。筐体の厚さ、内部部品の寸法、確認できない配線は写真からの推定を含み、画面は静止表示です。",
      en: "Sandblasted black aluminium, transparent glass with individual edge dots, four amplifier stages, DAC and USB circuitry, resistors, capacitors, solder joints and traces are built as geometry. The logo, PCB markings and display also use solid letter outlines. The hollow sockets, milled volume knob and rounded buttons are detailed enough to zoom in on. Enclosure thickness, internal dimensions and obscured routing include estimates from photos; the display is static.",
    },
    specifications: [
      {
        label: { ja: "外形寸法", en: "Dimensions" },
        value: {
          ja: "85 × 155.7 mm（幅 × 奥行、メーカー公表値）",
          en: "85 × 155.7 mm (W × D, manufacturer’s published footprint)",
        },
      },
      {
        label: { ja: "質量", en: "Weight" },
        value: { ja: "330.8 g", en: "330.8 g" },
      },
      {
        label: { ja: "D/A コンバーター", en: "D/A converters" },
        value: { ja: "ESS ES9069Q × 2", en: "2 × ESS ES9069Q" },
      },
      {
        label: { ja: "USB 入力", en: "USB input" },
        value: {
          ja: "PCM 768 kHz / 32 bit · DSD 512",
          en: "PCM 768 kHz / 32 bit · DSD 512",
        },
      },
      {
        label: { ja: "入力", en: "Inputs" },
        value: {
          ja: "USB-C · 光 / 同軸デジタル · 3.5 mm / 4.4 mm アナログ · Bluetooth 5.4",
          en: "USB-C · optical / coaxial digital · 3.5 mm / 4.4 mm analog · Bluetooth 5.4",
        },
      },
      {
        label: { ja: "ヘッドホン出力", en: "Headphone outputs" },
        value: {
          ja: "6.35 mm · 4.4 mm バランス · 3.5 mm",
          en: "6.35 mm · balanced 4.4 mm · 3.5 mm",
        },
      },
      {
        label: { ja: "バッテリー", en: "Battery" },
        value: {
          ja: "4300 mAh · 最大約12時間再生 · 充電専用 USB-C",
          en: "4300 mAh · up to 12 hours playback · dedicated USB-C charging port",
        },
      },
    ],
    sources: [
      {
        title: {
          ja: "メーカー製品情報・写真",
          en: "Manufacturer’s product information and photos",
        },
        href: "https://www.questyle.com/products/questyle-sigma-pro-portable-bluetooth-dac-with-headphone-amplifier",
      },
      {
        title: {
          ja: "メーカー製品資料（英語）",
          en: "Manufacturer’s product brochure (English)",
        },
        href: "https://www.supersonido.es/media/productos/58083/docs/documento-27894.pdf",
      },
      {
        title: {
          ja: "日本正規代理店の製品仕様",
          en: "Japanese distributor’s specifications",
        },
        href: "https://questyle.jp/questyle「sigma-pro」登場-プリアンプ搭載・デュアルdac構成/",
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
      en: "The model includes the domed honeycomb grille and recessed driver, fine grooves in the metal baffle, and the fibers and seams of the fabric ear pads. The headband lettering, channel markings and detachable connector details are modeled as well. Exterior and component dimensions are estimated from photos; the cables are shortened for display.",
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
      en: "The model includes the external honeycomb grilles, central emblems and circular engravings, perforated 20 mm cushions, leather headband and adjustment stems. With the cable detached, both 3.5 mm sockets and the inner pads are visible. Exterior and component dimensions include estimates from photos.",
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
  {
    id: "ie-600",
    model: "ie-600",
    manufacturer: "Sennheiser",
    name: "IE 600",
    finish: {
      ja: "シルバー / 梨地仕上げ",
      en: "Silver / Textured finish",
    },
    category: { ja: "カナル型イヤホン", en: "In-ear headphones" },
    description: {
      ja: "7 mm TrueResponse トランスデューサーとデュアル・レゾネーター・チャンバー（D2CA）を搭載したカナル型イヤホン。3Dプリントされた AMLOY-ZR01 アモルファスジルコニウムの小さなハウジングを、手作業で仕上げています。",
      en: "In-ear headphones with 7 mm TrueResponse transducers and dual resonator chambers (D2CA). The compact AMLOY-ZR01 amorphous zirconium housings are 3D printed and finished by hand.",
    },
    details: {
      ja: "丸みのある一体形状の梨地ハウジング、彫り込まれたロゴと型番、角度の付いたノズル、保護格子と中空構造を持つシリコン製イヤーチップを再現。MMCX端子の接点、右側の赤いリング、左側の触覚マーク、半透明の耳掛けケーブル内の撚り線も確認できます。単体表示では左のMMCX端子を外して接続部を見せています。外形・部品寸法はメーカー写真からの推定で、ケーブルは表示用に短く描いています。使用しているケーブルは4.4 mmバランス端子のため、据置きではUD-505正面の4.4 mm出力に接続します。HA-1A MK2には接続しません。",
      en: "The model includes the rounded, textured metal housings, engraved emblems and model lettering, angled nozzles, and hollow silicone ear tips with protective guards. Details include MMCX contacts, the right connector’s red ring, the left tactile marker, and twisted wires inside translucent over-ear cables. The standalone view detaches the left MMCX connector to reveal its contacts. Exterior and component dimensions are estimated from manufacturer photos; cables are shortened for display. My cable uses a 4.4 mm balanced plug, so the desktop system connects to UD-505’s front 4.4 mm output. It does not connect to HA-1A MK2.",
    },
    specifications: [
      {
        label: { ja: "方式", en: "Transducer principle" },
        value: {
          ja: "シングルダイナミック / カナル型",
          en: "Single dynamic driver / in-ear",
        },
      },
      {
        label: { ja: "ドライバー", en: "Drivers" },
        value: { ja: "7 mm TrueResponse", en: "7 mm TrueResponse" },
      },
      {
        label: { ja: "周波数特性", en: "Frequency response" },
        value: { ja: "4 Hz – 46,500 Hz", en: "4 Hz – 46,500 Hz" },
      },
      {
        label: { ja: "インピーダンス", en: "Impedance" },
        value: { ja: "18 Ω", en: "18 Ω" },
      },
      {
        label: { ja: "感度", en: "Sound pressure level" },
        value: {
          ja: "118 dB SPL / 1 Vrms @ 1 kHz",
          en: "118 dB SPL / 1 Vrms at 1 kHz",
        },
      },
      {
        label: { ja: "ケーブル・接続端子", en: "Cables and connectors" },
        value: {
          ja: "1.25 m · 3.5 mm / 4.4 mm バランス · Fidelity (+) MMCX（着脱式）",
          en: "1.25 m · 3.5 mm / balanced 4.4 mm · detachable Fidelity (+) MMCX",
        },
      },
    ],
    sources: [
      {
        title: {
          ja: "メーカー製品情報・写真",
          en: "Manufacturer’s product information and photos",
        },
        href: "https://jp.sennheiser-hearing.com/ja/products/ie-600",
      },
      {
        title: { ja: "取扱説明書", en: "Owner’s manual" },
        href: "https://cdn.sennheiser-hearing.com/product-documents/product-downloads/ie-600/instruction_manual/Instruction_manual_IE_600.pdf",
      },
    ],
  },
  {
    id: "audioquest-cinnamon",
    model: "audioquest-cinnamon",
    manufacturer: "AudioQuest",
    name: "Cinnamon USB 2.0 A–B",
    finish: { ja: "レッド / ブラック", en: "Red / Black" },
    category: { ja: "USB オーディオケーブル", en: "USB audio cable" },
    description: {
      ja: "NODE の USB-A 出力と UD-505 の USB-B 入力を接続する、1.5 m の Cinnamon USB 2.0 ケーブル。型番は USB2/CIN/1.5 です。",
      en: "A 1.5 m Cinnamon USB 2.0 cable connecting NODE’s USB-A output to UD-505’s USB-B input. Model: USB2/CIN/1.5.",
    },
    details: {
      ja: "赤黒の編組、赤い金属調カバー、黒いケーブル根元、CINNAMON の印字を再現。単体表示では金色の中空端子と内部の接点を確認できます。ケーブルの余長は二巻きにし、外装寸法はメーカー写真から推定しています。",
      en: "The model includes the red/black braid, red metallic covers, black strain-relief boots and CINNAMON markings. The standalone view exposes the hollow gold-colored connectors and internal contacts. The cable is arranged in two loops; exterior dimensions are estimated from manufacturer photos.",
    },
    specifications: [
      {
        label: { ja: "型番", en: "Model" },
        value: { ja: "USB2/CIN/1.5", en: "USB2/CIN/1.5" },
      },
      {
        label: { ja: "ケーブル長", en: "Length" },
        value: { ja: "1.5 m", en: "1.5 m" },
      },
      {
        label: { ja: "接続端子", en: "Connectors" },
        value: { ja: "USB 2.0 Type-A → Type-B", en: "USB 2.0 Type-A → Type-B" },
      },
      {
        label: { ja: "外装", en: "Jacket" },
        value: { ja: "赤黒の編組", en: "Red/black braid" },
      },
      {
        label: { ja: "導体", en: "Conductors" },
        value: {
          ja: "1.25% シルバーコーティング LGC",
          en: "1.25% silver-plated LGC",
        },
      },
    ],
    sources: [
      {
        title: {
          ja: "国内公式の製品情報・写真",
          en: "Japanese distributor’s product information and photos",
        },
        href: "https://www.dm-importaudio.jp/audioquest/lineup/detail1/index1385.html",
      },
    ],
  },
  {
    id: "cybershaft-bnc",
    model: "cybershaft-bnc",
    manufacturer: "Cybershaft",
    name: "50Ω BNC Semi-Rigid",
    finish: { ja: "ブルー / シルバー", en: "Blue / Silver" },
    category: { ja: "クロック用BNCケーブル", en: "BNC clock cable" },
    description: {
      ja: "CG-10M の 10 MHz OUT 1 と UD-505 の CLOCK SYNC IN を接続する、サイバーシャフト 50Ω BNCセミリジッドケーブル。RG402 規格の同軸ケーブルを使用しています。",
      en: "A Cybershaft 50Ω BNC semi-rigid cable connecting CG-10M’s 10 MHz OUT 1 to UD-505’s CLOCK SYNC IN, using RG402 coaxial cable.",
    },
    details: {
      ja: "青い被覆、銀色のローレット付きBNC端子、黒い熱収縮チューブを再現。単体表示では端子内部の白い絶縁体と金色の中心ピンを確認できます。緩やかな弧を保つセミリジッドの形状を表現し、部品寸法と表示用のケーブル長はメーカー写真から推定しています。",
      en: "The model includes the blue jacket, silver knurled BNC connectors and black heat-shrink sleeves. The standalone view exposes the white dielectric and gold-colored centre pins. The cable retains a gentle semi-rigid bend; component dimensions and the displayed cable length are estimated from manufacturer photos.",
    },
    specifications: [
      {
        label: { ja: "ケーブル規格", en: "Cable specification" },
        value: { ja: "RG402", en: "RG402" },
      },
      {
        label: { ja: "インピーダンス", en: "Impedance" },
        value: { ja: "50 Ω", en: "50 Ω" },
      },
      {
        label: { ja: "接続端子", en: "Connectors" },
        value: { ja: "BNC 50 Ω / BNC 50 Ω", en: "BNC 50 Ω / BNC 50 Ω" },
      },
      {
        label: { ja: "販売されている長さ", en: "Available lengths" },
        value: { ja: "0.3 / 0.5 / 1.0 / 1.5 m", en: "0.3 / 0.5 / 1.0 / 1.5 m" },
      },
      {
        label: { ja: "接続先", en: "System connection" },
        value: {
          ja: "CG-10M 10 MHz OUT 1 → UD-505 CLOCK SYNC IN",
          en: "CG-10M 10 MHz OUT 1 → UD-505 CLOCK SYNC IN",
        },
      },
    ],
    sources: [
      {
        title: {
          ja: "メーカー製品情報・写真",
          en: "Manufacturer’s product information and photos",
        },
        href: "https://www.cybershaft.jp/option01/semirg02.html",
      },
    ],
  },
];

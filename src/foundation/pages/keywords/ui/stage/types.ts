import type {
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

export type Vec3 = readonly [number, number, number];

type ControlBase = {
  /** params のキー。 */
  key: string;
  label: string;
  /** 補足説明（ツールチップではなく下段に小さく表示する）。 */
  hint?: string;
};

export type RangeControl = ControlBase & {
  type: "range";
  min: number;
  max: number;
  step: number;
  value: number;
  /** 表示用の書式。省略時は step から桁数を決める。 */
  format?: (value: number) => string;
};

export type ToggleControl = ControlBase & {
  type: "toggle";
  value: boolean;
};

export type SelectControl = ControlBase & {
  type: "select";
  value: string;
  options: readonly { value: string; label: string }[];
};

/** 押すたびに DemoInstance.action が呼ばれる。 */
export type ButtonControl = ControlBase & {
  type: "button";
};

export type DemoControl =
  | RangeControl
  | ToggleControl
  | SelectControl
  | ButtonControl;

export type DemoParams = Record<string, number | boolean | string>;

export type LegendItem = { color: string; label: string };

export type PointerState = {
  /** 正規化デバイス座標（-1〜1）。 */
  ndc: Vector2;
  inside: boolean;
  down: boolean;
};

export type FrameInfo = {
  /** 再生中だけ進む経過秒。 */
  time: number;
  /** 前フレームからの秒数（最大 1/20 秒に制限）。 */
  dt: number;
};

export type DemoContext = {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  canvas: HTMLCanvasElement;
  /** 操作パネルの現在値。毎フレーム最新値を参照できる。 */
  params: DemoParams;
  pointer: PointerState;
  /** 描画サイズ（CSS ピクセル）。 */
  size: Vector2;
  /** HUD の数値表示を更新する（空文字でその項目を消す）。 */
  readout: (label: string, value: string) => void;
  /** camera.autoRotate で指定した自動回転を止めたり再開したりする。 */
  setAutoRotate: (enabled: boolean) => void;
  /** デモ側からパラメータを変更し、操作パネルの表示にも反映する。 */
  setParam: (key: string, value: number | boolean | string) => void;
  /** 状況説明の一文を HUD に出す。 */
  caption: (text: string) => void;
  /** 3D 空間に追従する HTML ラベル。 */
  label: (
    text: string,
    options?: {
      color?: string | undefined;
      tone?: "strong" | "muted";
      size?: "sm" | "md";
    }
  ) => Object3D & { setText: (text: string) => void };
  /** 右下の HUD 領域に DOM 要素を追加する（グラフなど）。 */
  hud: (element: HTMLElement) => void;
  /** ステージ全面に重ねる DOM 要素を追加する（位置は要素側の CSS で決める）。 */
  overlay: (element: HTMLElement) => void;
  /** 描画をまるごと差し替える（ポストプロセスやレンダーターゲット用）。 */
  setRender: (render: (() => void) | null) => void;
  /** リサイズ時に呼ばれる。 */
  onResize: (handler: (width: number, height: number) => void) => void;
  /** 平面上でドラッグできるハンドルを登録する。 */
  draggable: (
    object: Object3D,
    options: {
      /** ドラッグ面の法線（既定は +Y）。 */
      normal?: Vec3;
      /** ドラッグ面が通る点（既定はオブジェクト位置）。 */
      origin?: Vec3;
      clamp?: (position: Vector3) => unknown;
      onDrag?: (position: Vector3) => unknown;
    }
  ) => void;
  /** キャンバス上のクリック（ドラッグでない押下）で、指定平面上の点を受け取る。 */
  onPick: (
    handler: (point: Vector3) => void,
    plane?: { normal?: Vec3; origin?: Vec3 }
  ) => void;
  /** ポインターが指している平面上の点（キャンバス外なら null）。 */
  pointerOnPlane: (
    plane?: { normal?: Vec3; origin?: Vec3 },
    target?: Vector3
  ) => Vector3 | null;
  /** dispose 時にまとめて破棄する。 */
  track: <T extends { dispose: () => void }>(resource: T) => T;
};

export type DemoInstance = {
  update: (frame: FrameInfo) => void;
  action?: (key: string) => void;
  /** パラメータ変更時に呼ばれる。 */
  change?: (key: string, value: number | boolean | string) => void;
  dispose?: () => void;
};

export type DemoModule = {
  /** キャンバスの代替テキスト。 */
  alt: string;
  camera?: {
    position: Vec3;
    target?: Vec3;
    fov?: number;
    /** 自動回転（度/秒）。 */
    autoRotate?: number;
    /** 視点操作を許可するか（既定 true）。 */
    orbit?: boolean;
  };
  /** 既定の背景・フォグ・照明を使うか（既定 true）。 */
  studio?:
    | boolean
    | {
        floor?: boolean;
        fog?: boolean;
        background?: string;
        shadows?: boolean;
      };
  /** 明るい部分をにじませる（UnrealBloomPass）。 */
  bloom?: { strength?: number; radius?: number; threshold?: number };
  controls?: readonly DemoControl[];
  legend?: readonly LegendItem[];
  /** 操作方法の短い案内。 */
  hint?: string;
  setup: (context: DemoContext) => DemoInstance;
};

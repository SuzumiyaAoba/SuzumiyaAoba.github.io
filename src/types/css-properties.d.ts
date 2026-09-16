declare module "react" {
  // `style` prop で CSS カスタムプロパティ（--*）を型安全に使えるようにする。
  // oxlint-disable-next-line typescript/consistent-type-definitions -- 宣言マージには interface が必須
  interface CSSProperties {
    // oxlint-disable-next-line typescript/consistent-indexed-object-style -- 宣言マージでは Record 型は使えない
    [key: `--${string}`]: string | number;
  }
}

export {};

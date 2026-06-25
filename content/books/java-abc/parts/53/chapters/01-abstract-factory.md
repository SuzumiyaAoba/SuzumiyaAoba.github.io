---
title: Abstract Factory パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Abstract Factory パターン

**Abstract Factory**（抽象工場）パターンは、**「互いに関連する複数のオブジェクトを、まとめて作る」**ためのパターンです。

Factory Method が「**1 つの製品を作る役**」だったのに対し、Abstract Factory は「**製品一式を作る役**」と思ってください。

---

## 解きたい問題

GUI のテーマを例にします。

- **Light テーマ**には、`LightButton`・`LightTextField`・`LightDialog`
- **Dark テーマ**には、`DarkButton`・`DarkTextField`・`DarkDialog`

があり、**家族をまたいで混在させてはいけない**とします（`DarkButton` と `LightTextField` を一緒に置いたら、見た目がちぐはぐになる）。

```java
// △ 個別に作ると、家族の整合性が崩れがち
Button button = new DarkButton();
TextField text = new LightTextField();    // 家族違い!
```

「**家族をそろえる**」ことを、構造として強制したい ―― これが Abstract Factory の出番です。

---

## 構造と登場人物

```text
AbstractFactory（抽象工場）
  ├ createButton(): Button
  └ createTextField(): TextField
        ↑
  LightFactory                  DarkFactory
  ├ createButton: LightButton    ├ createButton: DarkButton
  └ createTextField: LightTextF  └ createTextField: DarkTextField
```

各製品（Button, TextField）にもインターフェースを切り、家族ごとに**実装をそろえます**。

---

## 実装例 ― UI 部品の家族

製品インターフェース:

```java
public interface Button {
    void render();
}

public interface TextField {
    void render();
}
```

実装（Light 家族）:

```java
public class LightButton implements Button {
    @Override public void render() { System.out.println("[Light Button]"); }
}
public class LightTextField implements TextField {
    @Override public void render() { System.out.println("[Light TextField]"); }
}
```

実装（Dark 家族）は同様に。

そして、**抽象工場**:

```java
public interface UiFactory {
    Button createButton();
    TextField createTextField();
}

public class LightUiFactory implements UiFactory {
    @Override public Button createButton() { return new LightButton(); }
    @Override public TextField createTextField() { return new LightTextField(); }
}

public class DarkUiFactory implements UiFactory {
    @Override public Button createButton() { return new DarkButton(); }
    @Override public TextField createTextField() { return new DarkTextField(); }
}
```

呼び出し側は、**工場 1 つ**だけを受け取ります。

```java
public class Screen {
    private final UiFactory factory;
    public Screen(UiFactory factory) { this.factory = factory; }

    public void show() {
        Button b = factory.createButton();
        TextField t = factory.createTextField();
        b.render(); t.render();
    }
}
```

「テーマ切替」は、**工場を取り替えるだけ**で済みます。

```java
Screen light = new Screen(new LightUiFactory());
Screen dark = new Screen(new DarkUiFactory());
light.show();   // [Light Button] [Light TextField]
dark.show();    // [Dark Button]  [Dark TextField]
```

家族の整合性が、**型レベルで強制される**のが醍醐味です。

---

## Factory Method との違い

| 観点 | Factory Method | Abstract Factory |
|---|---|---|
| 作る数 | 1 つの製品 | 関連する**複数の製品** |
| 抽象化の単位 | メソッド | **クラス（工場全体）** |
| 主たる関心 | 「**どれを作るか**」をサブクラスに委ねる | 「**どの家族を作るか**」を切り替える |
| 例 | `ShippingService#createLabel` | `UiFactory#createButton` + `createTextField` |

Abstract Factory は、**Factory Method の集まり**として実装することが多いです。

---

## 現代の Java では

製品インターフェースの**実装が単純**で、家族の数も**2 〜 3 つ**しかないなら、`Map<Theme, Supplier<Button>>` のような **マップで切り替える**のも、十分実用的です。

```java
Map<String, Supplier<Button>> buttonFactory = Map.of(
    "LIGHT", LightButton::new,
    "DARK", DarkButton::new
);
Button b = buttonFactory.get("LIGHT").get();
```

「クラスを 6 〜 8 つ用意して工場を組む」必要が、本当にあるかは検討の価値ありです。
**家族の数と整合性の厳しさ**で、フル実装に進むかを決めます。

---

## 使いどころと注意点

- **製品の家族**が増減する可能性が小さい（家族の構成は固定）
- **家族ごとの整合性**を、型システムで担保したい
- フレームワークや SDK の**プラグイン機構**を作る

逆に向かない場面:

- 家族の数や種類が**よく変わる**（製品が増えるたびに全工場を直すことになる）
- 家族間で混在を許してよい（Strategy で十分）

---

## まとめ

- **Abstract Factory** は「**家族をまとめて作る**」生成パターン
- 工場を切り替えるだけで、整合する製品群が手に入る
- Factory Method の**集合体**として捉えるとわかりやすい
- 製品の家族構成が固定的なときに効く

次の章では、**Builder** ―― **段階的にオブジェクトを組み立てる**パターンを見ます。

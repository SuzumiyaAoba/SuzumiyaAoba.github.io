---
title: Mediator パターン
llm: true
co-author: ["Claude Opus 4.7"]
---

## Mediator パターン

**Mediator**（調停者）パターンは、**複数のオブジェクトが互いに連絡を取り合う状況を、1 つの調停者を通じてやり取りさせる**振る舞いパターンです。

オブジェクト同士の**直接参照**を減らし、**スター型**の構造で結合度を下げます。

---

## 解きたい問題

ダイアログを考えてみます。

- 「氏名」テキストボックス: 入力されると、「保存」ボタンが押せるようになる
- 「年齢」テキストボックス: 数値以外なら、「警告」ラベルを出す
- 「保存」ボタン: 押されると、すべての項目をチェックして、ファイルに保存する
- 「キャンセル」ボタン: 押されると、ダイアログを閉じる

各部品が**互いに知り合う**形で書くと、

```java
nameField.onChange = () -> {
    if (!nameField.text.isEmpty()) saveButton.enable();
};
ageField.onChange = () -> {
    if (!isNumeric(ageField.text)) warning.show();
};
saveButton.onClick = () -> {
    if (nameField.valid && ageField.valid) save();
};
```

部品が増えるたびに、**「誰が誰を呼ぶか**」の関係が爆発します。
新しい部品を 1 つ加えると、**他の部品全部を直す**ことになりかねません。

**「部品同士のやり取りを、調停者が代行する**」 ―― それが Mediator です。

---

## 構造と登場人物

```text
       Mediator
      ↗  ↑  ↖
    Btn  Txt  Lbl  ← 部品（Colleagues）
```

部品（Colleagues、コリーグ）は、**Mediator だけを参照**します。
変化があったら Mediator に伝え、**他の部品をどう動かすか**は Mediator が決めます。

---

## 実装例 ― ダイアログの調停

```java
public interface DialogMediator {
    void onNameChanged(String name);
    void onAgeChanged(String age);
    void onSaveClicked();
}

public class TextField {
    private final String name;
    private String text = "";
    private final DialogMediator mediator;
    public TextField(String name, DialogMediator mediator) {
        this.name = name; this.mediator = mediator;
    }
    public void setText(String t) {
        this.text = t;
        if ("name".equals(name)) mediator.onNameChanged(t);
        else if ("age".equals(name)) mediator.onAgeChanged(t);
    }
    public String text() { return text; }
}

public class Button {
    private final DialogMediator mediator;
    private boolean enabled = false;
    public Button(DialogMediator mediator) { this.mediator = mediator; }
    public void click() {
        if (enabled) mediator.onSaveClicked();
    }
    public void setEnabled(boolean e) { this.enabled = e; }
}
```

調停者は、すべての部品を知っています。

```java
public class UserDialog implements DialogMediator {
    private TextField name;
    private TextField age;
    private Button save;

    public UserDialog() {
        this.name = new TextField("name", this);
        this.age = new TextField("age", this);
        this.save = new Button(this);
    }

    @Override public void onNameChanged(String value) {
        save.setEnabled(!value.isEmpty() && !age.text().isEmpty());
    }
    @Override public void onAgeChanged(String value) {
        save.setEnabled(!name.text().isEmpty() && !value.isEmpty());
    }
    @Override public void onSaveClicked() {
        System.out.println("保存: " + name.text() + " / " + age.text());
    }

    public TextField name() { return name; }
    public TextField age() { return age; }
    public Button save() { return save; }
}
```

呼び出し:

```java
UserDialog dialog = new UserDialog();
dialog.name().setText("Alice");
dialog.age().setText("30");
dialog.save().click();   // → 保存: Alice / 30
```

部品同士は**互いを知りません**。すべての連絡は、Mediator を経由します。

---

## Observer との違い

両者は「**通知**」を扱う点で似ています。

| 観点 | Observer | Mediator |
|---|---|---|
| 主な目的 | 状態変化の**通知** | 部品間の**やり取り**を取り持つ |
| 通信の方向 | Subject → 多くの Observer | 多対多を **1 点経由**にする |
| Subject の知る相手 | 不特定（**疎結合**） | 限定された部品（**集約**） |

Observer は「**広く知らせる**」、Mediator は「**全員の通訳になる**」とイメージするとよいでしょう。

---

## イベントバスと Mediator

メッセージング基盤の**イベントバス**（Guava EventBus、Spring の `ApplicationEventPublisher`）は、**汎用化された Mediator**です。

```java
@Component
public class OrderListener {
    @EventListener
    public void on(OrderPlacedEvent e) { /* ... */ }
}

@Service
public class OrderService {
    private final ApplicationEventPublisher publisher;
    public void place(Order o) {
        // ... 保存処理 ...
        publisher.publishEvent(new OrderPlacedEvent(o));
    }
}
```

`OrderService` は、`OrderListener` を知りません。**イベントバスが調停**します。
モジュール間を**疎結合**にしたいときに重宝します。

---

## 使いどころと注意点

向く場面:

- 多対多の通信を**1 点にまとめたい**
- **UI の部品調整**、ダイアログ、モジュール間連携
- イベント駆動の**ハブ**

注意点:

- 調停者が**何でも知る神クラス**になりがち
- 内部のロジックが**ふくれ上がる**と、見通しが落ちる
- 通信ログ・追跡が必要なら、**仕組みとして用意**する（流れが見えにくくなる）

---

## まとめ

- **Mediator** は、多対多の通信を**1 点に集める**振る舞いパターン
- 部品同士の直接参照を断ち、**疎結合**にする
- Observer との違い: 一方向通知 vs 多対多の調停
- イベントバスは、汎用化された Mediator

次の章では、**Memento** ―― 状態を取っておく振る舞いパターンを見ます。

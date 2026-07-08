---
title: GraalVM をインストールする
llm: true
---

## GraalVM をインストールする

ネイティブイメージを試すには、まず **GraalVM**（GraalVM Native Image を含む JDK）をインストールします。
この節では、いくつかのインストール方法を紹介します。

---

## GraalVM とは

**GraalVM** は、Oracle が中心となって開発する**JDK の代替実装**です。
特徴を整理すると、

| 構成 | 内容 |
|---|---|
| **Java の JDK 機能** | 普通の `javac`・`java` として使える |
| **GraalVM Compiler** | HotSpot の JIT を置き換える、強力な JIT |
| **Native Image ビルダー** | バイトコードをネイティブにコンパイルする |
| **多言語サポート**（Truffle） | Python、JavaScript、Ruby などを JVM 上で実行 |

本書では「**Native Image を持っている JDK**」として GraalVM を使います。
GraalVM は、Oracle 版（GraalVM for JDK）と、コミュニティ版（GraalVM Community Edition、GraalVM CE）があります。
本書ではコミュニティ版を使います。

---

## インストール方法1: mise を使う（推奨）

**mise**（旧 rtx）は、複数バージョンの JDK を切り替えやすくする、現代的なツールチェーン管理ツールです。
本書のサンプル検証も mise で行っています。

```text line-numbers=false
$ mise install java@graalvm-community-25
$ mise use --global java@graalvm-community-25
```

または、プロジェクトディレクトリ単位で:

```text line-numbers=false
$ cd my-project/
$ mise use java@graalvm-community-25
$ java --version
openjdk 25 2025-09-16
OpenJDK Runtime Environment GraalVM CE 25-dev+...
OpenJDK 64-Bit Server VM GraalVM CE 25-dev+...
```

mise なら、`mise.toml` にプロジェクト固有の JDK を書いておけるので、チーム全員のローカル環境がそろいます。

---

## インストール方法2: SDKMAN!

**SDKMAN!** も、JDK 管理の定番ツールです。Linux/macOS で広く使われます。

```text line-numbers=false
$ sdk install java 25-graal
$ sdk use java 25-graal
```

---

## インストール方法3: 公式インストーラ

GraalVM の[公式ダウンロード](https://www.graalvm.org/downloads/)から、

- Linux: tar.gz をダウンロード
- macOS: tar.gz または pkg
- Windows: zip または msi

を入手して、`JAVA_HOME` を設定します。

```text line-numbers=false
$ export JAVA_HOME=/path/to/graalvm
$ export PATH=$JAVA_HOME/bin:$PATH
$ java --version
```

---

## インストール方法4: Docker

ビルド環境を**コンテナで揃えたい**場合は、公式の Docker イメージが便利です。

```text line-numbers=false
$ docker pull container-registry.oracle.com/graalvm/jdk:latest
```

CI でネイティブイメージビルドを行うときは、このパターンが定石です。

---

## `native-image` コマンドの確認

GraalVM が入ったら、`native-image` コマンドが使えるか確認します。

```text line-numbers=false
$ native-image --version
native-image 25-dev (Java Version 25)
GraalVM Native Image - ...
```

このコマンドが、第3節で実際に使うネイティブイメージビルダーです。

---

## ネイティブビルドに必要な追加ツール

`native-image` は、ローカルの**C コンパイラ・リンカ**を内部で使います。
そのため、OS によっては追加ツールが必要です。

### Linux

```text line-numbers=false
$ sudo apt install build-essential libz-dev
# または
$ sudo dnf install gcc glibc-devel zlib-devel
```

### macOS

```text line-numbers=false
$ xcode-select --install
```

Xcode コマンドラインツールが入っていれば OK です。

### Windows

Microsoft Visual Studio の Build Tools が必要です。
GraalVM 公式ドキュメントに、必要なコンポーネントが書いてあります。

---

## 起動確認 ―― ふつうの Java として動くか

ネイティブイメージを試す前に、まず GraalVM が**ふつうの JDK として**動くことを確認します。

```text line-numbers=false
$ cat > Hello.java <<EOF
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello from GraalVM!");
    }
}
EOF
$ javac Hello.java && java Hello
Hello from GraalVM!
```

これが動けば、ふつうの JDK 部分は問題ありません。
あとは、第3節で `native-image` を呼び、ネイティブ実行ファイルを作るだけです。

---

## バージョンの選び方

GraalVM のリリースカレンダーは、ふつうの Java と歩調を合わせています。

- 半年に 1 回の機能リリース（Java 25、26、...）
- 2 年に 1 回の LTS（Long-Term Support）リリース

本書では **GraalVM for JDK 25** を前提に書きますが、

- **LTS 版を選ぶ**: 17 や 21
- **最新版を選ぶ**: 24 や 25

のいずれかが現実的です。
本番運用なら **LTS 推奨**、最新機能を試すなら**最新リリース**、と使い分けます。

---

## まとめると

- **GraalVM** は、Native Image を含む JDK の代替実装
- インストールは **mise・SDKMAN!・公式・Docker** など複数の方法
- ネイティブビルドには、OS 側の **C コンパイラ・リンカ**が必要
- まずふつうの `javac`・`java` として動くことを確認
- LTS と最新の使い分けは、本番か実験かで決める

次の節では、`native-image` コマンドを使って、実際にネイティブ実行ファイルをビルドします。

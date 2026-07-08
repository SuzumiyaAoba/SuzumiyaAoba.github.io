---
title: Java の誕生と歩み
llm: true
co-author: ["Claude Opus 4.7"]
---

## Java の誕生と歩み

これから学ぶ **Java** は、どのように生まれた言語なのでしょうか。

プログラミング言語の歴史を細かく覚える必要はありません。
しかし、「なぜこの言語が作られたのか」「どんな目的を持っていたのか」を知ると、Java という言語の性格が見えてきます。

この節では、Java の誕生から現在までの歩みを、かんたんにたどってみましょう。

---

## 始まりは「家電のための言語」だった

Java の開発が始まったのは、1991年のことです[^java-1991-green]。

当時、アメリカの **Sun Microsystems**（サン・マイクロシステムズ）という会社で、**James Gosling**（ジェームズ・ゴスリング）を中心とした技術者たちが、ある研究プロジェクトを進めていました[^gosling-bio]。

このプロジェクトの目標は、意外なものでした。
それは、**パソコンのための言語ではなく、家電製品を制御するための言語を作る**ことだったのです[^java-1991-green]。

テレビやその周辺機器、調理家電といった、さまざまな機器をプログラムで動かす。
そのためには、特定の機械だけでなく、**いろいろな種類の機器で同じように動くプログラム**を書ける仕組みが必要でした。

この「いろいろな機器で同じように動く」という発想こそが、のちに Java の最大の特徴となる考え方の出発点でした。

---

## 「Oak」から「Java」へ

開発の初期、この言語には **Oak**（オーク、樫の木）という名前が付けられていました。
ゴスリングのオフィスの外に立っていた樫の木にちなんで名付けられた、と言われています[^oak-naming]。

しかし、Oak という名前はすでに別の会社の商標として使われていました。
そこで新しい名前が必要になり、最終的に選ばれたのが **Java**（ジャバ）です。

これは、インドネシアのジャワ島産のコーヒー（Java coffee）に由来すると言われています[^java-naming]。
Java のロゴが湯気の立つコーヒーカップなのは、この名前の由来にちなんだものです。

---

## 1995年、Java の登場

Java が世の中に公開されたのは、**1995年**です[^java-1995-release]。

当初ねらっていた家電の分野では、時代がまだ追いついておらず、Java はあまり広まりませんでした。
ところが、ちょうどこの時期に急速に普及し始めていたものがありました。**インターネットと Web ブラウザ**です。

Java が掲げていた「いろいろな環境で同じように動く」という特徴は、世界中のさまざまなコンピュータがつながるインターネットの世界と、とても相性がよいものでした。

この特徴は、有名なスローガンで表現されました。

```text line-numbers=false
Write Once, Run Anywhere
（一度書けば、どこでも動く）
```

一度書いたプログラムを、Windows でも、Mac でも、その他のさまざまな環境でも、書き直すことなく動かせる。
この考え方が高く評価され、Java は急速に注目を集めるようになりました。

そして翌1996年には、Java で開発を行うための最初の正式な道具一式（JDK 1.0）が公開され、Java は本格的に使われ始めます[^jdk-1-release]。

---

## オープンソースへ

その後、Java はさまざまな分野へと活躍の場を広げていきます。
特に、企業の業務システムや Web サービスの裏側（サーバーサイド）で、広く使われるようになりました。

開発の歴史のなかで重要だったのが、**オープンソース化**です。

2000年代後半、Java の中核部分のソースコードが、誰でも自由に利用・改良できる形で公開されました。
このとき公開された実装が、現在の Java の土台となっている **OpenJDK**（オープンジェイディーケー）です[^openjdk-launch]。

オープンソース化によって、Java は特定の一社だけのものではなくなり、世界中の開発者や企業が開発に参加できるようになりました。
このことが、Java が長く使われ続ける大きな支えになっています。

OpenJDK については、後の節であらためて触れます。

---

## Sun から Oracle へ

長らく Java を開発してきた Sun Microsystems は、2009年、大手ソフトウェア企業である **Oracle**（オラクル）に買収されることになりました[^oracle-sun-acquisition]。

- 2009年4月：Oracle が Sun を買収すると発表
- 2010年1月：買収が正式に完了

これ以降、Java の開発の中心は Oracle が担うようになり、現在に至ります。

なお、Java の生みの親であるジェームズ・ゴスリングは、買収後まもなく会社を去りました。
しかし、彼が築いた Java は、その後も多くの技術者の手によって発展を続けています。

---

## バージョンを重ねて進化してきた

Java は、公開されてから現在まで、何度もバージョンアップを重ねてきました。
バージョンが上がるたびに、新しい機能が追加され、より書きやすく、より高速になっています。

歴史のなかでも特に大きな節目となったバージョンを、いくつか挙げてみましょう[^java-version-history]。

| 年 | バージョン | 主なできごと |
|---|---|---|
| 1996年 | Java 1.0 | 最初の正式版 |
| 2004年 | Java 5 | 型を安全に扱う「ジェネリクス」などを導入[^java5-generics] |
| 2014年 | Java 8 | 「ラムダ式」「ストリーム API」を導入し、書き方が大きく進化[^java8-lambda] |
| 2017年 | Java 9 | 半年ごとに新バージョンを出す方式へ移行[^jep322] |
| 2021年 | Java 17 | 長期サポート版（LTS）のひとつ |
| 2023年 | Java 21 | 「仮想スレッド」など、現代的な機能を強化[^jep444-vthreads] |
| 2025年 | Java 25 | 本書が対象とする最新の長期サポート版[^jdk25-release] |

それぞれの機能の意味は、いまはわからなくて大丈夫です。
ここで知ってほしいのは、**Java は止まっている言語ではなく、いまも進化を続けている言語**だということです。

2017年（Java 9）からは、新しいバージョンが半年ごとに公開されるようになりました[^jep322]。
この新しいリリースの仕組みや、「長期サポート版（LTS）」という言葉の意味については、この章の最後の節でくわしく説明します。

---

## なぜ Java は長く使われ続けているのか

最初のバージョンから約30年がたった今も、Java は世界でもっとも広く使われている言語のひとつです。

これほど長く使われ続けている理由には、次のようなものがあります。

- **互換性を大切にしてきた** ： 古いプログラムが、新しい環境でもできるだけそのまま動くように配慮されてきた
- **進化を続けている** ： 時代に合わせて、新しい便利な機能が追加され続けている
- **どこでも動く** ： 「一度書けば、どこでも動く」という特徴が、今も多くの場面で役立っている
- **使う人が多い** ： 利用者が多いため、情報や道具が豊富で、困ったときに調べやすい

新しい言語が次々と登場するなかで、これだけ長く第一線で使われ続けている言語は多くありません。
Java を学ぶことは、長く役立つ知識を身につけることにつながります。

---

## まとめ

この節では、Java の誕生と歩みを学びました。

- Java の開発は1991年、Sun Microsystems のジェームズ・ゴスリングらによって始まった
- もともとは、家電製品を制御するための言語として考えられていた
- 当初は「Oak」という名前だったが、のちに「Java」と名付けられた
- 1995年に公開され、「一度書けば、どこでも動く（Write Once, Run Anywhere）」という特徴で注目を集めた
- 中核部分はオープンソース化され、現在の OpenJDK の土台となっている
- 2010年、開発元の Sun は Oracle に買収され、以降は Oracle が開発の中心を担っている
- Java はバージョンを重ねて進化を続けており、本書は最新の長期サポート版である Java 25 を対象とする

「いろいろな環境で同じように動く」という Java の発想は、家電のための言語として生まれた最初期から一貫しています。

次の節では、この特徴をはじめとする、Java という言語が持つ具体的な特徴を見ていきます。

[^java-1991-green]: Oracle, "About the Java Technology — The History of Java Technology," [https://www.oracle.com/java/technologies/javase/codenames.html](<https://www.oracle.com/java/technologies/javase/codenames.html>) および Oracle, "Java Technology: The Early Years," [https://www.oracle.com/technical-resources/articles/java/javahistory-timeline.html](<https://www.oracle.com/technical-resources/articles/java/javahistory-timeline.html>)。Sun Microsystems の "Green Project"（1991年開始）が Java の起源とされる。

[^gosling-bio]: Oracle, "James Gosling — The Father of Java," [https://www.oracle.com/java/moved-by-java/james-gosling/](<https://www.oracle.com/java/moved-by-java/james-gosling/>)。James Gosling は Sun Microsystems で Green Project を率い、後に Java の設計者として知られた。

[^oak-naming]: Byte Magazine, "The Birth of Java" (1995) ほか複数の一次資料で、当初の言語名 "Oak" がゴスリングのオフィス窓外の樫の木にちなむと記録されている。James Gosling の oral history（Computer History Museum 所蔵）も参照: [https://www.computerhistory.org/collections/catalog/102702199](<https://www.computerhistory.org/collections/catalog/102702199>)。

[^java-naming]: Oracle, "The Story of Java — Codename," [https://www.oracle.com/java/technologies/javase/codenames.html](<https://www.oracle.com/java/technologies/javase/codenames.html>)。"Oak" が商標上の理由で使えず、最終的に "Java"（コーヒーにちなむ）が選ばれた経緯が記載されている。

[^java-1995-release]: Sun Microsystems プレスリリース（1995年5月23日 SunWorld での発表）。Oracle, "Java Technology: The Early Years," [https://www.oracle.com/technical-resources/articles/java/javahistory-timeline.html](<https://www.oracle.com/technical-resources/articles/java/javahistory-timeline.html>) に当時の経緯が要約されている。

[^jdk-1-release]: Oracle, "JDK Release Notes — JDK 1.0," [https://www.oracle.com/java/technologies/javase/release-notes.html](<https://www.oracle.com/java/technologies/javase/release-notes.html>)。JDK 1.0 は1996年1月23日に公開された。

[^openjdk-launch]: OpenJDK Project, "About," [https://openjdk.org/](<https://openjdk.org/>)。Sun は2006年に Java SE をオープンソース化することを発表し、2007年に OpenJDK プロジェクトを GPL v2 ライセンスで公開した。

[^oracle-sun-acquisition]: Oracle, "Oracle Buys Sun," [https://www.oracle.com/corporate/pressrelease/oracle-buys-sun-042009.html](<https://www.oracle.com/corporate/pressrelease/oracle-buys-sun-042009.html>)（2009年4月20日発表）。買収は2010年1月27日に完了した（Oracle 2010年第3四半期決算発表）。

[^java-version-history]: Oracle, "Java Version History," [https://www.java.com/releases/](<https://www.java.com/releases/>) および [https://www.oracle.com/java/technologies/java-se-support-roadmap.html](<https://www.oracle.com/java/technologies/java-se-support-roadmap.html>)。各バージョンのリリース日と主要機能が公式にまとめられている。

[^java5-generics]: Oracle, "Java SE 5.0 (Tiger) — New Features and Enhancements," [https://docs.oracle.com/javase/1.5.0/docs/relnotes/features.html](<https://docs.oracle.com/javase/1.5.0/docs/relnotes/features.html>)。Java SE 5.0 では Generics、Enum、autoboxing、enhanced for などが導入された。

[^java8-lambda]: Oracle, "Java SE 8 — Features and Enhancements," [https://www.oracle.com/java/technologies/javase/8-whats-new.html](<https://www.oracle.com/java/technologies/javase/8-whats-new.html>) および JSR 335 (Lambda Expressions), [https://jcp.org/en/jsr/detail?id=335](<https://jcp.org/en/jsr/detail?id=335>)。Java SE 8（2014年3月）で Lambda 式と Stream API が導入された。

[^jep322]: JEP 322: Time-Based Release Versioning, [https://openjdk.org/jeps/322](<https://openjdk.org/jeps/322>)。Java 9（2017年）以降、半年ごとのフィーチャーリリース方式が採用された。

[^jep444-vthreads]: JEP 444: Virtual Threads, [https://openjdk.org/jeps/444](<https://openjdk.org/jeps/444>)。仮想スレッドは Java 21（2023年9月）で標準機能として確定した（プレビュー段階の JEP 425, JEP 436 を経て）。

[^jdk25-release]: Oracle, "JDK 25 Release Notes," [https://www.oracle.com/java/technologies/javase/25-relnotes.html](<https://www.oracle.com/java/technologies/javase/25-relnotes.html>)。Java 25 は2025年9月16日に LTS としてリリースされた。

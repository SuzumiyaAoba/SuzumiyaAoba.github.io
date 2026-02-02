---
title: Codex Web で Java を動かす
date: 2026-02-02
category: プログラミング
tags: ["Codex", "Java"]
---

Codex Web で Java (Gradle) リポジトリの実装をさせたところビルドでエラーが発生し、
その解決方法がわかったのでメモ。

## 設定

解決方法は OpenAI Developer Community の掲示板に書かれていた。

- [Issue with Running Java Maven Tests in Codex - Dependency Resolution Failure - Codex / Codex CLI - OpenAI Developer Community](https://community.openai.com/t/issue-with-running-java-maven-tests-in-codex-dependency-resolution-failure/1283045)

[Codex の環境設定](https://chatgpt.com/codex/settings/environments) を開いて Java リポジトリの開発で使うときの環境を選択。
「編集」をクリックし、「セットアップ スクリプト」に以下のスクリプトを貼り付ける。

```shell
#!/usr/bin/env bash
set -euxo pipefail     # fail hard, fail fast, print everything

# 1. System update & required packages
apt-get update -qq
apt-get install -yqq maven

# 2. Verify the install (good for debugging)
mvn   -v

# 3. Configure Maven to use the Codex proxy
mkdir -p ~/.m2
cat > ~/.m2/settings.xml <<'EOF'
<settings>
  <proxies>
    <proxy>
      <id>codexProxy</id>
      <active>true</active>
      <protocol>http</protocol>
      <host>proxy</host>
      <port>8080</port>
    </proxy>
  </proxies>
</settings>
EOF
```

参考にした投稿の 4 番目のステップは消している。それがあると逆にエラーが発生してしまった。
これで Codex Web から Java の開発ができるようになった :tada:

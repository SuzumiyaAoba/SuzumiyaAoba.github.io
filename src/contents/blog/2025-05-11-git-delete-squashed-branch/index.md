---
title: Squash and merge した後のブランチを掃除する
date: 2025-05-11
category: プログラミング
tags: ["プログラミング", "git"]
---

## はじめに

GitHub を使ってブランチをマージするときには 3 つの選択肢がある。

- Create a merge commit
- Rebase and merge
- Squash and merge

仕事では Create a merge commit を使うことが多いが、個人開発では Squash and merge を使った場合の面倒事が発生することが少ないため、master ブランチにちょっとした修正のコミット履歴を残さないように Sqaush and merge を使うことがある。

Squash and merge を使ったときの面倒事についてはググると記事が見つかるのでそちらを参照して欲しい。

- [Git の Squash マージをやめた話 - Mobile Factory Tech Blog](https://tech.mobilefactory.jp/entry/2023/11/29/160000)
- [【開発】スカッシュマージを卒業しプロダクトを加速させるブランチ戦略へ | SocialDog Tech Blog](https://www.wantedly.com/companies/socialdog/post_articles/461640)

Squash and merge した後にコンフリクトが発生する問題については、rebase するときのオプションで解決できるらしい。

- [Git で squash merge後にmergeされたコミットを含むbranchがコンフリクトするのを解決する #onto - Qiita](https://qiita.com/nakamasato/items/680f3908437b72eb7186)
- [squash mergeの環境でCascading PRsでコンフリクトした時 - oinume journal](https://journal.lampetty.net/entry/resolve-squash-merge-conflict)

しかし、マージ済みブランチを削除するとき `-d` ではなく `-D` で消さなければいけない。
定期的に `git pull --prune` してローカルのマージ済みブランチも掃除しているのでコマンド一発でマージ済みブランチを消せないのは不便に感じる。

## `--no-ff` の場合

Create a merge commit でマージしたときは次の alias を `~/.config/git/config` に設定しているので `git delete-merge-branch` コマンドでマージ済みブランチを削除している。

```
[alias]
	delete-merged-branch = "!f () { git checkout $1; git branch --merged|egrep -v '\\*|develop|main|master'|xargs git branch -d; git fetch --prune; };f"
```

このエイリアスは以下の記事を参考に `develop`、`main`、`master` ブランチを保護するようにしたものだ。

- [Gitでマージ済みブランチを一括削除 #Git - Qiita](https://qiita.com/hajimeni/items/73d2155fc59e152630c4)
- [Git マージ済みのブランチを一括削除する #Bash - Qiita](https://qiita.com/ucan-lab/items/97c53a1a929d2858275b)

しかし、これだと Squash and merge でマージしたブランチが消えない問題がある。

## Squash and merge に対応したい

ググってみると方法は 3 つ見つかった。

- [seachicken/gh-poi: ✨ Safely clean up your local branches](https://github.com/seachicken/gh-poi)
- [not-an-aardvark/git-delete-squashed: Delete branches that have been squashed and merged into main](https://github.com/not-an-aardvark/git-delete-squashed)
- [teppeis/git-delete-squashed: Delete branches that have been squashed and merged into master](https://github.com/teppeis/git-delete-squashed)
- [GitHub で Squash merge されたブランチを削除する · ryym.log](https://ryym.tokyo/posts/delete-squash-merged-branch/)

一つ目は `gh` コマンドの拡張として開発されている poi、
二つ目と三つ目は npx を使って実行できる Node パッケージとして配布されている git-delete-squashed、
四つ目は git-delete-squashed をシェルスクリプトで実装したものになっている。

## gh-poi

今回は poi を試してみる。
gh コマンドを使うので最初にログインする。

```shell
$ gh auth login
? Where do you use GitHub? GitHub.com
? What is your preferred protocol for Git operations on this host? SSH
? Generate a new SSH key to add to your GitHub account? Yes
? Enter a passphrase for your new SSH key (Optional):
? Title for your SSH key: GitHub CLI
? How would you like to authenticate GitHub CLI? Login with a web browser

! First copy your one-time code: XXXX-XXXX
Press Enter to open https://github.com/login/device in your browser...
✓ Authentication complete.
- gh config set -h github.com git_protocol ssh
✓ Configured git protocol
✓ Uploaded the SSH key to your GitHub account: /Users/suzumiyaaoba/.ssh/id_ed25519.pub
✓ Logged in as SuzumiyaAoba
```

gh コマンドを使ったことがない方は [Installation](https://github.com/cli/cli#installation) を参考にインストールしてください。

ログインできたら gh-poi をインスールする。

```shell
$ gh extension install seachicken/gh-poi
✓ Installed extension seachicken/gh-poi
```

Squash マージ済みのブラントを消すためのコマンド `gh poi` を実行すると次のようになった。

```shell
$ gh poi
✔ Fetching pull requests...
✔ Deleting branches...

Deleted branches
  improve-header
    └─ #38  https://github.com/SuzumiyaAoba/SuzumiyaAoba.github.io/pull/38 SuzumiyaAoba
  posts
    └─ #42  https://github.com/SuzumiyaAoba/SuzumiyaAoba.github.io/pull/42 SuzumiyaAoba

Branches not deleted
  clean
    └─ #29  https://github.com/SuzumiyaAoba/SuzumiyaAoba.github.io/pull/29 SuzumiyaAoba
* master
  pagefind
    └─ #24  https://github.com/SuzumiyaAoba/SuzumiyaAoba.github.io/pull/24 SuzumiyaAoba
```

確かに Squash マージしたブランチを削除できた。
git-delete-squashed と違って GitHub の PR 情報を元に Squash マージ済みのブランチか否かを判定しているようだ。

GitHub からデータを取得するのはいまいちな気もするがしばらく使ってみる。
問題があれば git-delete-squashed も試してみたい。

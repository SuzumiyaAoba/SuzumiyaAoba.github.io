---
title: Apple M1 で Jekyll を実行するまで
author: SuzumiyaAoba
date: 2021-01-13 00:19:00 +0800
categories: [Blog, Jekyll]
tags: [Jekyll, Apple M1, メモ]
math: true
mermaid: true
---

このブログは Jekyll を使って生成しているが、ここまでの記事はローカルでのプレビューを行わずに書いてきた。
流石に不便だったのでローカルで実行する環境を整えたのでそのメモ。

**この記事は 2020/01/13 現在におけるものです。この問題は恐らく時間が解決してくれます。**

## 環境

![Mac miniの環境](/images/2020-01-13-jekyll-on-apple-m1/env.png)

## 正攻法

macOS を使っていて [Homebrew](https://brew.sh/index_ja) をインストールしていない人はいないはず。
Homebrew が入っている前提で話すと、成功法は恐らく以下のコマンドを打つことだろう。

```console
~ $ brew install ruby # ruby ってデフォルトで macOS に入ってるっけ (?)
~ $ gem install bundler jekyll
~ $ jekyll new my-awesome-site
~ $ cd my-awesome-site
~/my-awesome-site $ bundle exec jekyll serve
```

[公式](https://jekyllrb.com)の Quick-start Instructions をコピーしてきただけだが、残念ながらこれでは上手く動かない。
`bundle exec jekyll serve` で失敗してしまう
(もしかしたら `gem install bundler jekyll` も失敗するかもしれない。
しかし、この辺のエラーはメッセージ通りにコマンドを打ってソースコードからインストールすれば通るはずだ)。

そして、以下のようなエラーログが流れるだろう。

```console
~ $ bundle exec jekyll serve
Traceback (most recent call last):
	21: from /usr/local/bin/jekyll:23:in `<main>'
	20: from /usr/local/bin/jekyll:23:in `load'
	19: from /Library/Ruby/Gems/2.6.0/gems/jekyll-4.2.0/exe/jekyll:8:in `<top (required)>'
	18: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	17: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	16: from /Library/Ruby/Gems/2.6.0/gems/jekyll-4.2.0/lib/jekyll.rb:195:in `<top (required)>'
	15: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	14: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	13: from /Library/Ruby/Gems/2.6.0/gems/jekyll-sass-converter-2.1.0/lib/jekyll-sass-converter.rb:4:in `<top (required)>'
	12: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	11: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	10: from /Library/Ruby/Gems/2.6.0/gems/jekyll-sass-converter-2.1.0/lib/jekyll/converters/scss.rb:3:in `<top (required)>'
	 9: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	 8: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	 7: from /Library/Ruby/Gems/2.6.0/gems/sassc-2.4.0/lib/sassc.rb:31:in `<top (required)>'
	 6: from /Library/Ruby/Gems/2.6.0/gems/sassc-2.4.0/lib/sassc.rb:31:in `require_relative'
	 5: from /Library/Ruby/Gems/2.6.0/gems/sassc-2.4.0/lib/sassc/native.rb:3:in `<top (required)>'
	 4: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	 3: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	 2: from /Library/Ruby/Gems/2.6.0/gems/ffi-1.14.2/lib/ffi.rb:4:in `<top (required)>'
	 1: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
/System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require': cannot load such file -- 2.6/ffi_c (LoadError)
	22: from /usr/local/bin/jekyll:23:in `<main>'
	21: from /usr/local/bin/jekyll:23:in `load'
	20: from /Library/Ruby/Gems/2.6.0/gems/jekyll-4.2.0/exe/jekyll:8:in `<top (required)>'
	19: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	18: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	17: from /Library/Ruby/Gems/2.6.0/gems/jekyll-4.2.0/lib/jekyll.rb:195:in `<top (required)>'
	16: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	15: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	14: from /Library/Ruby/Gems/2.6.0/gems/jekyll-sass-converter-2.1.0/lib/jekyll-sass-converter.rb:4:in `<top (required)>'
	13: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	12: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	11: from /Library/Ruby/Gems/2.6.0/gems/jekyll-sass-converter-2.1.0/lib/jekyll/converters/scss.rb:3:in `<top (required)>'
	10: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	 9: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	 8: from /Library/Ruby/Gems/2.6.0/gems/sassc-2.4.0/lib/sassc.rb:31:in `<top (required)>'
	 7: from /Library/Ruby/Gems/2.6.0/gems/sassc-2.4.0/lib/sassc.rb:31:in `require_relative'
	 6: from /Library/Ruby/Gems/2.6.0/gems/sassc-2.4.0/lib/sassc/native.rb:3:in `<top (required)>'
	 5: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	 4: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
	 3: from /Library/Ruby/Gems/2.6.0/gems/ffi-1.14.2/lib/ffi.rb:3:in `<top (required)>'
	 2: from /Library/Ruby/Gems/2.6.0/gems/ffi-1.14.2/lib/ffi.rb:6:in `rescue in <top (required)>'
	 1: from /System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require'
/System/Library/Frameworks/Ruby.framework/Versions/2.6/usr/lib/ruby/2.6.0/rubygems/core_ext/kernel_require.rb:54:in `require': dlopen(/Library/Ruby/Gems/2.6.0/gems/ffi-1.14.2/lib/ffi_c.bundle, 0x0009): missing compatible arch in /Library/Ruby/Gems/2.6.0/gems/ffi-1.14.2/lib/ffi_c.bundle - /Library/Ruby/Gems/2.6.0/gems/ffi-1.14.2/lib/ffi_c.bundle (LoadError)
```

`ffi` とかいうのが悪いのか :thinking: と思ったが、そもそも Ruby の最新バージョンっていくつよ！って話。
最近 Ruby 3.0.0 がリリースされたけど、2系の最新は 2.7.x !  
Ruby のバージョン上げれば全て解決するのでは :bulb: と思ったらそれが正解でした。

## 正しい道

ruby-build, rbenv をインストールする。

```console
~ $ brew install ruby-build rbenv
```

自分の使っているシェルに合わせて設定ファイルを記述。
fish を使っているので `~/.config/fish/config.fish` に以下を追記した。

```fish
set -x fish_user_paths $fish_user_paths $HOME/.rbenv/bin
status --is-interactive; and source (rbenv init -|psub)
```

次に rbenv で Ruby 2.7.2 をインストールする。

```console
~ $ rbenv install -l
2.5.8
2.6.6
2.7.2
3.0.0
jruby-9.2.14.0
mruby-2.1.2
rbx-5.0
truffleruby-20.3.0
truffleruby+graalvm-20.3.0

Only latest stable releases for each Ruby implementation are shown.
Use 'rbenv install --list-all / -L' to show all local versions.

~ $ rbenv install 2.7.2

~ $ rbenv versions
* system
  2.7.2 (set by /Users/aoba/.rbenv/version)

~ $ rbenv global 2.7.2

~ $ rbenv versions
  system
* 2.7.2 (set by /Users/aoba/.rbenv/version)

~ $ ruby -v
ruby 2.7.2p137 (2020-10-01 revision 5445e04352) [arm64-darwin20]
```

人によっては `rbenv install 2.7.2` で失敗するかもしれない。
私の環境では何の問題もなく 2.7.2 をインストールすることができた。

ここからは Quick-start Intruction に従えば無事 Jekyll がローカルで使えるようになる。
インストールの途中で、

```console
Errno::EACCES: Permission denied @ dir_s_mkdir -
/Users/aoba/.rbenv/versions/2.7.2/lib/ruby/gems/2.7.0/extensions/arm64-darwin-20/2.7.0/nokogumbo-2.0.4
An error occurred while installing nokogumbo (2.0.4), and Bundler cannot continue.
Make sure that `gem install nokogumbo -v '2.0.4' --source 'https://rubygems.org/'` succeeds before bundling.
```

みたいなエラーが出て止まるかもしれないけど、メッセージに書いてあるように 
`sudo gem install nokogumbo -v '2.0.4' --source 'https://rubygems.org/'`
を実行してから再度 `bundle install` を繰り返していればいつかは上手くいくはず。

Apple M1 は発売されてから時間が経ったがまだまだ arm64 のバイナリがなくてインストールできない、
ソースコードのビルドからインストールしようと思ったけど、それもまだ対応されてなくてできないという場面が多い。
そういうのも楽しみの一つなのだけど。

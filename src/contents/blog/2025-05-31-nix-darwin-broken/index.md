---
title: 何もしていないのにパソコンが壊れた
date: 2025-05-31
category: "Nix"
tags: ["Nix"]
---

何もしていないのにパソコンが壊れた。

エンジニアにあるまじき発言ではあるが何もしていないのにパソコン (環境) が壊れてしまった。

## Nix

PC の環境構築に [Nix](https://nixos.org/) と呼ばれるパッケージ管理システムを使っている。
Nix を使っていると何が嬉しいのか、はインターネット上に熱い思いを語っている人たちに任せるとして、
ここ数週間この Nix によって管理していた環境が壊れてしまった。
壊れたというのは語弊があり、正確にはパッケージの更新ができない状態に陥っている。

Nix とは言ったが、macOS を使っているので正確には

- [Nix](https://nixos.org/)
- [darwin-nix](https://github.com/nix-darwin/nix-darwin)
- [Home Manager](https://github.com/nix-community/home-manager)
- [nix-homebrew](https://github.com/zhaofengli/nix-homebrew)

の組合せになる。

この環境で `sudo darwin-rebuild switch --flake` を実行すると数週間前から次のようなエラーが発生するようになった。

```shell
$ sudo darwin-rebuild switch --flake .#private-aarch64-256GB
building the system configuration...
error:
       … while calling the 'derivationStrict' builtin
         at <nix/derivation-internal.nix>:37:12:
           36|
           37|   strict = derivationStrict drvAttrs;
             |            ^
           38|

       … while evaluating derivation 'darwin-system-25.11.44a7d0e'
         whose name attribute is located at /nix/store/s7ga48spdagfm0j1rd740q52ih159g51-source/pkgs/stdenv/generic/make-derivation.nix:480:13

       … while evaluating attribute 'activationScript' of derivation 'darwin-system-25.11.44a7d0e'
         at /nix/store/a0qmksyiqyh60nda6fw7y1bzdv8w8vz2-source/modules/system/default.nix:89:7:
           88|
           89|       activationScript = cfg.activationScripts.script.text;
             |       ^
           90|

       … while evaluating the option `system.activationScripts.script.text':

       … while evaluating definitions from `/nix/store/a0qmksyiqyh60nda6fw7y1bzdv8w8vz2-source/modules/system/activation-scripts.nix':

       … while evaluating the option `system.activationScripts.applications.text':

       … while evaluating definitions from `/nix/store/a0qmksyiqyh60nda6fw7y1bzdv8w8vz2-source/modules/system/applications.nix':

       (stack trace truncated; use '--show-trace' to show the full, detailed trace)

       error: Package ‘glibc-nolibgcc-2.40-66’ in /nix/store/s7ga48spdagfm0j1rd740q52ih159g51-source/pkgs/development/libraries/glibc/default.nix:217 is not available on the requested hostPlatform:
         hostPlatform.config = "arm64-apple-darwin"
         package.meta.platforms = [
           "aarch64-linux"
           "armv5tel-linux"
           "armv6l-linux"
           "armv7a-linux"
           "armv7l-linux"
           "i686-linux"
           "loongarch64-linux"
           "m68k-linux"
           "microblaze-linux"
           "microblazeel-linux"
           "mips-linux"
           "mips64-linux"
           "mips64el-linux"
           "mipsel-linux"
           "powerpc64-linux"
           "powerpc64le-linux"
           "riscv32-linux"
           "riscv64-linux"
           "s390-linux"
           "s390x-linux"
           "x86_64-linux"
         ]
         package.meta.badPlatforms = [ ]
       , refusing to evaluate.

       a) To temporarily allow packages that are unsupported for this system, you can use an environment variable
          for a single invocation of the nix tools.

            $ export NIXPKGS_ALLOW_UNSUPPORTED_SYSTEM=1

          Note: When using `nix shell`, `nix build`, `nix develop`, etc with a flake,
                then pass `--impure` in order to allow use of environment variables.

       b) For `nixos-rebuild` you can set
         { nixpkgs.config.allowUnsupportedSystem = true; }
       in configuration.nix to override this.

       c) For `nix-env`, `nix-build`, `nix-shell` or any other Nix command you can add
         { allowUnsupportedSystem = true; }
       to ~/.config/nixpkgs/config.nix.
```

この影響でアプリケーションのインストールもアップロードもできなくなってしまった。

原因はエラーメッセージにもあるように現在の環境が `arm64-apple-darwin` として認識されていることだろう。

これのせいで業務にも支障が出そうだったので調べていたら GitHub で関連する Issue が見つかったのでメモしておく。
関連する Issue の様子を見ると解消には時間がかかりそうだ。

## システム名称の変更

どうやら事の発端は NixOS/nixpkgs に [lib/systems: use Darwin architecture names for `config` and `uname` by emilazy · Pull Request #393213 · NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/pull/393213) という PR が入ったことのようだ。

これまで ARM 64 ビット macOS (Apple Silicon) は `aarch64-apple-darwin` という名称で扱われていたがこの PR から `arm64-apple-darwin` という名称に変更されている。
この変更自体も LLVM 20 での変更に対応するための修正であるため、一番悪いのは LLVM。

AArch64 と arm64 という名称の使い分けについて意識していなかったが、LLVM の文脈では [LLVM のバックエンドの aarch64 と arm64 の違い - 組み込みの人。](https://embedded.hatenadiary.org/entry/20140427/p2) に書かれているように AArch64 は ARM によって作られたもので、ARM64 は Apple が作ったものらしい。
この記事では AArch64 の方に統一する動きがあったようだけど、月日が流れてまた別れることになったということなのかな…。

確かに手元で `uname -m` を実行すると `arm64` と表示される。

```shell
$ uname -m
arm64
```

このあたりの不一致を解消したいのだろうが、この影響でビルドに失敗するパッケージが出ているようだ。

- [scummvm: fix aarch64-darwin ranlib path by niklaskorz · Pull Request #407897 · NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/pull/407897)
- [bug: Firefox refusing to build on standalone MacOS setup · Issue #6878 · nix-community/home-manager](https://github.com/nix-community/home-manager/issues/6878)
- [Nix standalone on MacOS's system string is `arm64-apple-darwin` and not `aarch64-darwin` · Issue #401364 · NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/issues/401364)
- [copilot-language-server-fhs: Can't build on darwin · Issue #408666 · NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/issues/408666)

このあたりの PR、Issue の内容を見ると `stdenv.hostPlatform.config` を使わずにハードコーディングしていたようなパッケージや `stdenv.hostPlatform.darwinArch` を使っているパッケージがあおりを受けているようだ。

## 解決方法

調査中。現時点では nixpkgs の対応を待つしかない気がする。

全てのパッケージが使えない状態ということはないはずなので原因となっているパッケージを特定するしかないかもしれない。

## おわりに

早く解決してくれー。

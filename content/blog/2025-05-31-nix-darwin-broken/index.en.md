---
title: My Computer Broke Without Me Doing Anything
date: 2025-05-31
category: "Nix"
tags: ["Nix"]
model: GPT-5.2-Codex
---

My computer broke without me doing anything.

It sounds like something an engineer should never say, but my computer (environment) broke without me doing anything.

## Nix

I use a package management system called [Nix](https://nixos.org/) to set up my PC environment.
I'll leave the passionate explanations of why Nix is great to others on the internet, but in the past few weeks,
my Nix-managed environment broke. To be precise, package updates stopped working.

I said Nix, but since I'm on macOS, the exact stack is:

- [Nix](https://nixos.org/)
- [darwin-nix](https://github.com/nix-darwin/nix-darwin)
- [Home Manager](https://github.com/nix-community/home-manager)
- [nix-homebrew](https://github.com/zhaofengli/nix-homebrew)

In this environment, running `sudo darwin-rebuild switch --flake` started failing a few weeks ago with this error.

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

       error: Package 'glibc-nolibgcc-2.40-66' in /nix/store/s7ga48spdagfm0j1rd740q52ih159g51-source/pkgs/development/libraries/glibc/default.nix:217 is not available on the requested hostPlatform:
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

Because of this, I can no longer install or update applications.

As the error message indicates, the environment is currently recognized as `arm64-apple-darwin`.

This was about to affect my work, so I investigated and found relevant GitHub issues. It looks like it may take time to resolve.

## System name change

It seems the root cause was a PR in NixOS/nixpkgs: [lib/systems: use Darwin architecture names for `config` and `uname` by emilazy · Pull Request #393213 · NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/pull/393213).

Previously, ARM 64-bit macOS (Apple Silicon) was treated as `aarch64-apple-darwin`,
but this PR changed it to `arm64-apple-darwin`.
This change itself is to align with LLVM 20 changes, so the biggest culprit is LLVM.

I hadn't been conscious of the naming differences between AArch64 and arm64, but in the LLVM context,
as [LLVM backend differences between aarch64 and arm64 - Embedded person](https://embedded.hatenadiary.org/entry/20140427/p2) explains,
AArch64 is created by ARM, while ARM64 is created by Apple.
That article mentions a move to unify on AArch64, but perhaps time passed and they diverged again.

Indeed, running `uname -m` locally shows `arm64`.

```shell
$ uname -m
arm64
```

This mismatch is likely what they wanted to resolve, but it caused packages to fail to build.

- [scummvm: fix aarch64-darwin ranlib path by niklaskorz · Pull Request #407897 · NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/pull/407897)
- [bug: Firefox refusing to build on standalone MacOS setup · Issue #6878 · nix-community/home-manager](https://github.com/nix-community/home-manager/issues/6878)
- [Nix standalone on MacOS's system string is `arm64-apple-darwin` and not `aarch64-darwin` · Issue #401364 · NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/issues/401364)
- [copilot-language-server-fhs: Can't build on darwin · Issue #408666 · NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/issues/408666)

Looking at these PRs and issues, packages that hard-coded architecture strings instead of using `stdenv.hostPlatform.config`,
or packages using `stdenv.hostPlatform.darwinArch`, seem to be affected.

## Solution

<s>Under investigation. It seems we just have to wait for nixpkgs to catch up.</s>

<s>Not all packages should be broken, so we may need to identify the specific package causing it.</s>

Cause found: I had installed copilot-language-server. This matches the issue below.

- [copilot-language-server-fhs: Can't build on darwin · Issue #408666 · NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/issues/408666)

Since I manage Emacs packages with Nix, copilot-language-server was pulled in along with [copilot.el](https://github.com/copilot-emacs/copilot.el).
Temporarily removing copilot.el resolved the issue.

## Conclusion

<s>Fix it soon, please.</s>

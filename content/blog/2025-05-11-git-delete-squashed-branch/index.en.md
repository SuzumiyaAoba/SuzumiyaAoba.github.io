---
title: Cleaning Branches After Squash and Merge
date: 2025-05-11
category: Programming
tags: ["Programming", "git"]
---

## Introduction

When you merge branches on GitHub, there are three options.

- Create a merge commit
- Rebase and merge
- Squash and merge

At work I often use Create a merge commit, but in personal projects I sometimes use Squash and merge to avoid keeping small fix commits on `master`,
since the problems that arise are usually less troublesome.

For the common issues with Squash and merge, please refer to articles you can find by searching.

- [I stopped using squash merge in Git - Mobile Factory Tech Blog](https://tech.mobilefactory.jp/entry/2023/11/29/160000)
- [Graduating from squash merge and moving to a branch strategy that accelerates product development | SocialDog Tech Blog](https://www.wantedly.com/companies/socialdog/post_articles/461640)

The conflict issue after squash merge can apparently be solved with a rebase option.

- [Resolve conflicts for branches containing squash-merged commits in Git #onto - Qiita](https://qiita.com/nakamasato/items/680f3908437b72eb7186)
- [When Cascading PRs conflict in a squash merge environment - oinume journal](https://journal.lampetty.net/entry/resolve-squash-merge-conflict)

However, when deleting merged branches, you must use `-D` instead of `-d`.
I regularly run `git pull --prune` to clean up merged local branches, so it is inconvenient that I can't delete them with a single command.

## For `--no-ff`

When using Create a merge commit, I set the following alias in `~/.config/git/config` and delete merged branches with `git delete-merged-branch`.

```
[alias]
	delete-merged-branch = "!f () { git checkout $1; git branch --merged|egrep -v '\\*|develop|main|master'|xargs git branch -d; git fetch --prune; };f"
```

I modified this alias based on the following articles to protect `develop`, `main`, and `master`.

- [Bulk delete merged branches in Git #Git - Qiita](https://qiita.com/hajimeni/items/73d2155fc59e152630c4)
- [Bulk delete merged branches in Git #Bash - Qiita](https://qiita.com/ucan-lab/items/97c53a1a929d2858275b)

But with this, branches merged with Squash and merge are not removed.

## Want to support Squash and merge

When I searched, I found four methods.

- [seachicken/gh-poi: ✨ Safely clean up your local branches](https://github.com/seachicken/gh-poi)
- [not-an-aardvark/git-delete-squashed: Delete branches that have been squashed and merged into main](https://github.com/not-an-aardvark/git-delete-squashed)
- [teppeis/git-delete-squashed: Delete branches that have been squashed and merged into master](https://github.com/teppeis/git-delete-squashed)
- [Delete branches squashed on GitHub · ryym.log](https://ryym.tokyo/posts/delete-squash-merged-branch/)

The first is poi, developed as a `gh` extension.
The second and third are Node packages that can be run with npx.
The fourth is a shell-script implementation of git-delete-squashed.

## gh-poi

I decided to try poi. First, log in with gh.

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

If you haven't used the gh command, install it by following [Installation](https://github.com/cli/cli#installation).

After logging in, install gh-poi.

```shell
$ gh extension install seachicken/gh-poi
✓ Installed extension seachicken/gh-poi
```

When I ran `gh poi` to delete squash-merged branches, I got the following.

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

It did delete squash-merged branches.
Unlike git-delete-squashed, it seems to determine whether a branch is squash-merged based on GitHub PR information.

Fetching data from GitHub might not be ideal, but I'll try it for a while.
If I run into problems, I may also try git-delete-squashed.

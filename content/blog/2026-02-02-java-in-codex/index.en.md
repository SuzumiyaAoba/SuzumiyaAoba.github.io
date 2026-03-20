---
title: Running Java in Codex Web
date: 2026-02-02
category: Programming
tags: ["Codex", "Java"]
model: GPT-5.4
---

When I had Codex Web work on a Java (Gradle) repository, the build failed.
I figured out how to fix it, so I am leaving a note here.

## Settings

The solution was posted on the OpenAI Developer Community forum.

- [Issue with Running Java Maven Tests in Codex - Dependency Resolution Failure - Codex / Codex CLI - OpenAI Developer Community](https://community.openai.com/t/issue-with-running-java-maven-tests-in-codex-dependency-resolution-failure/1283045)

Open [Codex environment settings](https://chatgpt.com/codex/settings/environments) and select the environment you use for Java repository development.
Click "Edit" and paste the following script into "Setup script."

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

I removed step 4 from the referenced post. If I left it in, it caused an error instead.
With this, I can now do Java development from Codex Web :tada:

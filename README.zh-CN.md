<div align="center">

# 🍳 skillet

### AI agent 技能的包管理器

**查找、安装、版本管理、分享 `SKILL.md` 技能——基于 Git 仓库的注册表。**
无服务器、无账号、无锁定。一条 `npx @jnmetacode/skillet add <技能>` 就够了。

```bash
npx @jnmetacode/skillet add pdf
```

[English](./README.md) | 简体中文

![skillet 演示 — 搜索、安装（SHA 锁定）、脚手架与校验](docs/demo.gif)

</div>

---

Agent **Skills**（技能）正在成为主流——一个 `SKILL.md` 文件夹就能教会 agent
一项新能力（读 PDF、做幻灯片、抓网页……）。但分享技能的方式还很原始：从各种
仓库里复制粘贴、不锁版本、也没法发现别人写了什么。

**skillet** 就是技能界的 `npm`/`brew`：一条命令把技能装进你的项目、一个
lockfile 保证可复现，而注册表只是 Git 仓库里的一个 JSON 文件——无需托管任何
东西，任何人提个 PR 就能贡献。

```bash
npx @jnmetacode/skillet search pdf            # 发现技能
npx @jnmetacode/skillet add pdf               # 安装到 .claude/skills/
npx @jnmetacode/skillet list                  # 查看已安装
npx @jnmetacode/skillet new my-skill          # 创建你自己的技能
```

## 为什么选 skillet

- **技能是文件，不是依赖。** 像 [shadcn/ui](https://ui.shadcn.com) 一样，
  skillet 把技能*复制进你的仓库*（`.claude/skills/<名称>/`），可读可改——
  而不是埋进一个看不见的 `node_modules`。
- **可复现。** 每次安装都把精确的 commit SHA 记进 `skillet.lock.json`。提交
  这个文件，全队跑 `skillet install` 就能拿到字节级一致的技能（技能界的
  `npm ci`）。`add owner/repo#<sha>` 可以锁定单次安装；`skillet update` 把
  分支/标签重新解析到最新。
- **零基础设施。** 注册表是 Git 仓库里的一个 JSON 索引，走 raw GitHub 直接
  访问。没有后端、没有数据库、没有 API key，上架一个技能就是一个 PR。
- **哪儿都能装。** 注册表名称、任意 `owner/repo[/路径][#ref]`，或本地文件夹。
- **零依赖。** 纯 Node 内置模块 + 你系统里的 `git`。整个 CLI 只有几百行
  可读的代码。

## 安装来源

```bash
npx @jnmetacode/skillet add pdf                              # 从注册表
npx @jnmetacode/skillet add anthropics/skills/skills/pptx    # 任意 GitHub 仓库 + 子路径
npx @jnmetacode/skillet add owner/repo#v2.1.0                # 标签/分支
npx @jnmetacode/skillet add owner/repo#<commit-sha>          # 锁定精确 commit
npx @jnmetacode/skillet add ./skills/my-local-skill          # 本地文件夹
```

技能默认安装到 `.claude/skills/`（2026 年的通行惯例）。用 `skillet init` 或
`--dir` 可按项目修改。

## 在 Claude 里使用（MCP）

skillet 实现了 [Model Context Protocol](https://modelcontextprotocol.io)，
Claude Desktop / Claude Code 可以替你搜索和安装技能——"找个 PDF 技能装上"
直接就能用。加入 `claude_desktop_config.json`（或项目的 `.mcp.json`）：

```json
{
  "mcpServers": {
    "skillet": {
      "command": "npx",
      "args": ["-y", "@jnmetacode/skillet", "mcp"]
    }
  }
}
```


**任何 MCP 客户端**都能用——同一段 JSON，只是配置文件位置不同：

| 客户端 | 配置文件位置 |
| --- | --- |
| Claude Desktop | `claude_desktop_config.json` |
| Claude Code | 项目 `.mcp.json`（或直接装插件：`/plugin marketplace add jnMetaCode/local-agent-toolkit`） |
| Cursor | 项目 `.cursor/mcp.json` 或 `~/.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Cline | `cline_mcp_settings.json` |
| Zed | `settings.json` → `context_servers` |

（具体键名以你客户端的 MCP 文档为准——上面那段 `command`/`args` 在哪儿都一样。）

暴露的工具：`skillet_search`、`skillet_install`（仅限注册表来源、名称经过
校验）、`skillet_list`。零依赖——几百行 stdio JSON-RPC。

## 浏览注册表

```bash
npx @jnmetacode/skillet gallery        # 构建静态可搜索的 HTML gallery → site/
```

`skillet gallery` 把 [`registry/index.json`](registry/index.json) 渲染成一个
自包含页面（搜索、一键复制安装命令、链接）——零后端。仓库自带的 GitHub
Pages 工作流会在注册表变更时自动重建发布，在线版：
https://jnmetacode.github.io/skillet/

## 编写技能

```bash
npx @jnmetacode/skillet new web-scraper      # 用模板生成 web-scraper/SKILL.md
# 编辑……
npx @jnmetacode/skillet validate ./web-scraper
```

技能就是一个带 `SKILL.md` 的文件夹：

```markdown
---
name: web-scraper
description: 抓取网页并提取结构化数据；当用户需要网页内容时使用。
version: 0.1.0
license: MIT
keywords: [scrape, http]
---

# web-scraper
给 agent 读的指令……以及同目录下的辅助脚本。
```

推到 GitHub，然后提一个 PR 往 [`registry/index.json`](registry/index.json)
里加一行——详见 [docs/SPEC.md](docs/SPEC.md)。

## 命令一览

| | |
| --- | --- |
| `skillet search [关键词]` | 搜索注册表 |
| `skillet add <ref>` | 安装技能（注册表名 / `owner/repo[/路径][#ref]` / `./本地`） |
| `skillet install` | 按 lockfile 的锁定 commit 安装全部技能（`npm ci` 式） |
| `skillet list` | 列出已安装技能 |
| `skillet remove <名称>` | 卸载 |
| `skillet update [名称]` | 把跟踪的技能重装到最新 ref |
| `skillet new <名称>` | 脚手架新技能 |
| `skillet validate [路径]` | 校验 `SKILL.md` |
| `skillet gallery` | 构建静态可搜索的注册表 gallery |
| `skillet mcp` | 作为 MCP server 运行（stdio），供 Claude/agent 使用 |
| `skillet init` | 生成 `skillet.json` 配置 |

参数：`--force`、`--dir <路径>`、`--registry <url|路径>`、`--json`。

## 工作原理

```
  skillet add pdf
        │  在注册表索引（raw GitHub JSON）中解析名称
        ▼
  git clone --depth 1 anthropics/skills      ← 用你系统的 git，浅克隆
        │  复制 skills/pdf/ → .claude/skills/pdf/
        ▼
  把 commit SHA 锁进 skillet.lock.json
```

所谓"注册表"就是[一个 JSON 文件](registry/index.json)。整个后端仅此而已。

## 兼容性

凡是读 `SKILL.md` 技能文件夹的运行时都兼容（Claude Code / Claude Agent
Skills 及同类）。skillet 只是在开放的 `SKILL.md` 格式之上做发现 + 安装 +
版本管理——不绑定任何运行时。

## 状态

早期 MVP——发现、安装（注册表 / GitHub / 本地）、lockfile 锁定、编写与校验
今天全部可用。注册表已收录 22 个逐一验证过的技能。欢迎 Star/Watch；当前最有
价值的贡献是 PR 和新的注册表条目。

## 姊妹项目

同属一个小巧、本地优先、零依赖的 AI agent 工具套件——见
[套件总览与端到端示例](https://github.com/jnMetaCode/local-agent-toolkit)：

- 🍳 **skillet** —— agent 技能包管理器 *(本仓库)*
- 🔭 **[tracelet](https://github.com/jnMetaCode/tracelet)** —— 调试 agent 运行的本地 DevTools
- 🧠 **[engram](https://github.com/jnMetaCode/engram)** —— agent（和你）的本地私有记忆层

## 许可证

MIT —— 见 [LICENSE](LICENSE)。（通过 skillet 安装的技能保留其各自的许可证。）

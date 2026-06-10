# 发布攻略（内部）—— skillet 中文版

[English](./LAUNCH.md) | 简体中文

> 状态：**发布前清单已全部完成**（包已上线 npm v0.1.0、26 技能 registry、
> gallery 在线、GIF、文案就绪）。计划在 engram 发布约两周后启动。

## 发布前清单 —— ✅ 全部完成

- ✅ npm `@jnmetacode/skillet` 已发布并验证
- ✅ Registry 26 个技能（17 个 Anthropic + 9 个第一方），逐一验证可解析
- ✅ Gallery 在线：https://jnmetacode.github.io/skillet/ （registry 变更自动重建）
- ✅ Hero GIF（`docs/demo.gif`，`docs/demo.tape` 可重录）
- ⬜ *(可选)* `NPM_TOKEN` secret（未来 CI 自动发布用）

## Show HN 发帖

**时机**：engram 发布后约两周，同样选周二/周三、太平洋时间早 8 点，前 3
小时逐条回复评论。

**标题**（直接粘贴）：
> Show HN: Skillet – npm for AI agent skills (zero-infra, Git-backed registry)

（中文意思：Skillet——AI agent 技能界的 npm（零基础设施、Git 即注册表））

**正文**：直接粘贴英文版 LAUNCH.md 里的 Show HN body。中文释义：

> Agent Skills（教会 agent 一项能力的 SKILL.md 文件夹）已经随处可见，但分享
> 方式还停留在从各种仓库复制粘贴、没有版本、没有发现机制。skillet 是它们的
> 包管理器：`skillet add pdf` 在注册表里解析名称、浅克隆、把文件夹复制进
> `.claude/skills/`、把 commit SHA 锁进 lockfile。`new`+`validate` 帮你写自己
> 的技能；上架就是给一个 JSON 索引追加一行的 PR。我最喜欢的一点：没有后端——
> "注册表"就是 Git 仓库里的一个 JSON 文件，走 raw GitHub 直接读，类似
> Homebrew tap 或 shadcn/ui 的思路。今天就有 26 个真技能可装。期待对注册表
> 格式的反馈，以及你们想要哪些技能。

**回评论要点**：
- 被问"为什么不用 npm 本身装技能"→ 技能是给 agent 读的文件，要进仓库可读
  可改（shadcn 模式），不是进 node_modules 的代码依赖
- 被问安全 → 安装即复制文件、SHA 锁定、路径穿越有防护、MCP 安装仅限注册表
  来源且名称校验
- 有人想上架技能 → 引导走 `skill-submission` issue 模板或直接 PR

## 其他渠道（文案在英文版里粘贴即用）

- **r/ClaudeAI / r/LLMDevs**：完整帖已写好（HN 后 1-2 天发）
- **X 线程**：四条推已写好（"npm for SKILL.md"角度，第 1 条配 GIF）
- 一篇《如何发布你的技能》教程帖 = registry 增长漏斗

## 飞轮（真正的增长引擎）

Registry 就是护城河：每个来上架技能的作者都会带来他的用户。
1. 让 `skillet new → validate → PR` 的发布路径零摩擦
2. ✅ 种子内容已就位（26 个技能）
3. ✅ Gallery 已在线
4. 发布后：把 `skill-submission` issue 流量转化为 PR；在 gallery 里推荐
   新的社区技能

## 有起色之后

- GitHub Sponsors
- "每周技能"栏目维持热度
- 远期 open-core 切口：私有/团队注册表的托管付费版——但要等开放注册表
  先有动能

# internflow

Claude Code 插件：把实习日志从「每天写」到「月结 → 素材库」的流程收敛成一套可复用的 skill，并保证内容标准只有一个源。

- 插件名：`internflow`
- 当前版本：`0.3.0`
- 许可证：MIT

## 设计原则

- **内容标准唯一源**：记什么、怎么记、保密范围、月结与素材库字段，只写在用户的规则文件里。
- **流程在 skill**：怎么问、怎么落盘、怎么交付、怎么检查，由执行 skill 负责。
- **实现细节在 skill**：目录名、文件名、`[[链接]]` 写法、具体工具，不进规则。
- **用户数据不进插件**：插件只带规则模板、日志模板、素材库模板，不带任何人的日志、素材或公司信息。

## 安装

### 本地开发 / 试用

```bash
claude --plugin-dir "/path/to/internflow"
```

加载后 skill 以插件名为命名空间，例如 `internflow:internship-log`。修改 skill 后重开会话，或在会话里运行 `/reload-plugins`。

本地 `--plugin-dir` 不依赖 marketplace；`marketplace.json` 只用于分发。

### 从本仓库市场安装

```bash
claude plugin marketplace add https://github.com/renhao-wan/internflow.git
claude plugin install internflow@internflow-marketplace
```

> **第一次使用**：先运行 `/internflow:internship-log-rule-init` 定一份规则；之后日常写日志用 `/internflow:internship-log`。完整顺序见下文「从零使用顺序」。

## Skills

| Skill | 用途 | 面向 |
|---|---|---|
| `internship-log` | 写当天日志、主题笔记 | 日常使用 |
| `internship-log-review` | 只读审核日志，输出带行号和依据的问题清单 | 日常使用 |
| `internship-log-monthly` | 写本月小结、收口待问、更新素材库 | 日常使用 |
| `internship-log-retro` | 实习结束时汇总「未解决」，产出简历条目、面试提纲和能力清单 | 收尾 |
| `internship-log-rule-init` | 从零撰写规则 | 维护者 |
| `internship-log-rule-maintain` | 修改规则并同步执行 skill 的引用 | 维护者 |

Skill 名保持 `internship-log` 等原名，避免与旧的独立 skill 撞名；加载后由插件名提供命名空间，不会出现 `internship-log:internship-log` 这种前缀。

### 审核范围

| 调用 | 审核范围 |
|---|---|
| `/internflow:internship-log-review` | 最新月份的完整日志 |
| `/internflow:internship-log-review 2026-10` | 指定月份 |
| `/internflow:internship-log-review today` | 只审最新一条记录 |

## 从零使用顺序

1. `internship-log-rule-init`：定一份规则，写到你的用户数据目录。
2. `internship-log`：每天写日志；技术细节外置到 `主题笔记/`。
3. `internship-log-review`：需要时审日志，只读，不改日志正文。
4. `internship-log-monthly`：月底写本月小结，挑案例进素材库。
5. `internship-log-retro`：实习结束时汇总各月小结的「未解决」，产出简历条目、面试提纲和能力清单。
6. 规则要改时用 `internship-log-rule-maintain`；它会同时检查四个执行 skill 的引用。

第一次运行会询问规则文件和日志根目录。问齐后自动保存到项目根目录的 `.claude/internflow.local.md`，之后不用重复输入。

## 规则与数据

规则实例属于用户数据，不放进插件，也不在插件里维护第二份：

```text
你的用户数据目录/
├── 规则.md                  ← 唯一内容标准源，只在这里维护
└── <公司名>/
    └── <入职年月-岗位>/
        ├── YYYY-MM.md       ← 当月日志
        ├── 素材库.md
        └── 主题笔记/
```

插件内只有 `templates/规则.template.md`，它是章节骨架，不是规则实例。使用者复制到自己的数据目录后再填写。

日志里的 `[[规则]]` 是 Obsidian 双链，规则留在用户数据目录即可保持有效；插件不复制、不软链、不覆盖这份实例。

## 工作区配置

规则文件和日志根目录的路径保存在项目根目录的 `.claude/internflow.local.md`，不用每次重新输入。这是 Claude Code 插件的标准本地设置形式：YAML frontmatter 存配置，`.local.md` 后缀表示本地状态、不进版本库。

```markdown
---
rules: "D:/path/to/internship/规则.md"
log_root: "D:/path/to/internship"
---

# internflow 工作区配置

> 由 internflow skill 自动维护；含本地绝对路径，不要提交到公开仓库。
```

路径统一用正斜杠，避免 Windows 反斜杠转义；用双引号包裹，避免 YAML 把冒号、`#` 等字符误解析。约束：

- 懒创建：skill 启动时只读配置，不建目录；路径问齐并通过校验后，才创建 `.claude/` 并写入
- 用户本次给出的新路径校验通过后直接更新配置，不额外确认
- 覆盖已有值前先校验：`rules` 必须指向存在的文件，`log_root` 必须指向存在的目录；不满足就报错重问，不覆盖旧值
- 配置按项目根存放：在实习数据目录（作为项目根）启动 Claude Code 才能自动读到；换目录启动会重新询问
- 配置里的路径失效时，skill 报出原路径并重新询问，不自动搜索
- 文件含本地绝对路径；`.local.md` 后缀配合 `.gitignore` 的 `.claude/*.local.md` 规则挡住误提交，项目没有这条规则时先补上再写入

> 从 0.1.0 升级：旧版配置在 `.claude/internflow/config.json`。本插件不会自动读取或改写旧文件；首次运行时会按无配置处理并重新询问。确认新配置写入无误后，可自行删除旧文件。

查找顺序和完整约定见 `references/workspace.md`。

### 规则章节顺序

skill 和 README 里的「按规则第 X 节」按下面顺序引用。规则增删或重排章节后，用 `internship-log-rule-maintain` 同步更新引用和这张表；skill 和 README 都不要复述规则里的数字（轮数、条数上限等），需要时改成「按规则第 X 节」。

| 节号 | 章节 |
|---|---|
| 1 | 为什么写 |
| 2 | 三层结构 |
| 3 | 目录约定 |
| 4 | 每天写什么 |
| 5 | 待问怎么收口 |
| 6 | 业务理解怎么记 |
| 7 | 代码和架构图怎么记 |
| 8 | 和 AI 协作的约定 |
| 9 | 保密 |
| 10 | 月结与素材库 |
| 11 | 待完善 |

## 目录结构

```text
internflow/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── .github/
│   └── workflows/validate.yml
├── skills/
│   ├── internship-log/SKILL.md
│   ├── internship-log-review/SKILL.md
│   ├── internship-log-monthly/SKILL.md
│   ├── internship-log-retro/SKILL.md
│   ├── internship-log-rule-init/SKILL.md
│   └── internship-log-rule-maintain/SKILL.md
├── templates/
│   ├── 规则.template.md
│   ├── 日志.template.md
│   └── 素材库.template.md
├── references/
│   └── workspace.md
├── tests/
│   └── regression/
│       ├── README.md
│       └── fixtures/
├── scripts/
│   └── check.mjs
├── README.md
├── CHANGELOG.md
├── LICENSE
├── .gitattributes
└── .gitignore
```

## 开发与校验

```bash
node scripts/check.mjs
claude plugin validate --strict .claude-plugin/plugin.json
claude plugin validate --strict .claude-plugin/marketplace.json
```

要求全部通过后再发布。skill、agent、command 目录的结构校验由 `scripts/check.mjs` 负责，不依赖 `claude plugin validate` 对组件目录的版本差异。`scripts/check.mjs` 不依赖外部包，检查清单结构、skill 命名与 frontmatter、插件内路径引用、规则节号范围、README 章节表、配置路径与中文数字复述，以及文档里是否混入真实本地路径。GitHub Actions 在 push 和 PR 时先运行它，再安装 Claude Code CLI 运行上面两项官方校验。`claude plugin tag` 可在发布时生成版本 tag，但它会校验 `plugin.json` 和 marketplace 条目是否一致。

人工回归样例见 `tests/regression/README.md`，覆盖写日志、审核、月结、改规则和工作区配置五个场景。

## 约束

- 所有 skill 都不自动 `git commit`，不 push。
- 不编造用户没说的数字、结果、根因。
- 不把凭证、客户信息、内网地址、连接串、公司代码原文写进日志或本仓库。
- 用户日志、素材库、主题笔记、公司信息一律不进插件包。
- `.claude/internflow.local.md` 含本地绝对路径，按 `.gitignore` 的 `.claude/*.local.md` 规则排除，不提交。

## License

MIT

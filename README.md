# internflow

Claude Code 插件：把实习日志从「每天写」到「月结 → 素材库」的流程收敛成一套可复用的 skill，并保证内容标准只有一个源。

- 插件名：`internflow`
- 当前版本：`0.1.0`
- 许可证：MIT

## 设计原则

- **内容标准唯一源**：记什么、怎么记、保密范围、月结与素材库字段，只写在用户的规则文件里。
- **流程在 skill**：怎么问、怎么落盘、怎么交付、怎么检查，由执行 skill 负责。
- **实现细节在 skill**：目录名、文件名、`[[链接]]` 写法、具体工具，不进规则。
- **用户数据不进插件**：插件只带规则模板、日志模板、素材库模板，不带任何人的日志、素材或公司信息。

## 安装

### 本地开发 / 试用

```bash
claude --plugin-dir "D:\projects\claudecode-plugings\internflow"
```

加载后 skill 以插件名为命名空间，例如 `internflow:internship-log`。修改 skill 后重开会话，或在会话里运行 `/reload-plugins`。

本地 `--plugin-dir` 不依赖 marketplace；`marketplace.json` 只用于分发。

### 从本仓库市场安装

```bash
claude plugin marketplace add https://github.com/renhao-wan/internflow.git
claude plugin install internflow@internflow-marketplace
```

## Skills

| Skill | 用途 | 面向 |
|---|---|---|
| `internship-log` | 写当天日志、主题笔记 | 日常使用 |
| `internship-log-review` | 只读审核日志，输出带行号和依据的问题清单 | 日常使用 |
| `internship-log-monthly` | 写本月小结、收口待问、更新素材库 | 日常使用 |
| `internship-log-rule-init` | 从零撰写规则 | 维护者 |
| `internship-log-rule-maintain` | 修改规则并同步执行 skill 的引用 | 维护者 |

Skill 名保持 `internship-log` 等原名，避免与旧的独立 skill 撞名；加载后由插件名提供命名空间，不会出现 `internship-log:internship-log` 这种前缀。

## 从零使用顺序

1. `internship-log-rule-init`：定一份规则，写到你的用户数据目录。
2. `internship-log`：每天写日志；技术细节外置到 `主题笔记/`。
3. `internship-log-review`：需要时审日志，只读，不改文件。
4. `internship-log-monthly`：月底写本月小结，挑案例进素材库。
5. 规则要改时用 `internship-log-rule-maintain`；它会同时检查三个执行 skill 的引用。

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

### 规则章节顺序

skill 里的「按规则第 X 节」按下面顺序引用。规则增删或重排章节后，用 `internship-log-rule-maintain` 同步更新引用。

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
├── skills/
│   ├── internship-log/SKILL.md
│   ├── internship-log-review/SKILL.md
│   ├── internship-log-monthly/SKILL.md
│   ├── internship-log-rule-init/SKILL.md
│   └── internship-log-rule-maintain/SKILL.md
├── templates/
│   ├── 规则.template.md
│   ├── 日志.template.md
│   └── 素材库.template.md
├── README.md
├── LICENSE
└── .gitignore
```

## 开发与校验

```bash
claude plugin validate --strict .claude-plugin/plugin.json
claude plugin validate --strict .claude-plugin/marketplace.json
claude plugin validate --strict skills
```

要求全部通过后再发布。`claude plugin tag` 可在发布时生成版本 tag，但它会校验 `plugin.json` 和 marketplace 条目是否一致。

## 约束

- 所有 skill 都不自动 `git commit`，不 push。
- 不编造用户没说的数字、结果、根因。
- 不把凭证、客户信息、内网地址、连接串、公司代码原文写进日志或本仓库。
- 用户日志、素材库、主题笔记、公司信息一律不进插件包。

## License

MIT

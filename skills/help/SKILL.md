---
name: help
description: 显示 internflow 的状态、下一步建议和命令清单。当用户问“这个插件怎么用”“internflow 怎么用”“配置在哪”“下一步做什么”，或调用 /internflow:help 时使用。只读，不修改任何文件。
---

# internflow 帮助

单文件执行手册。**只读**：不创建配置、目录、日志，不调用其他 skill，不改任何文件。

## 参数

`$ARGUMENTS` 决定输出详细程度：

| 参数 | 输出 |
|---|---|
| 空 | 精简入口页：状态、下一步、命令表 |
| `all` | 完整入口页：精简页 + 约定速查 + 主题列表 |
| `config` | 配置主题页 |
| `log` | 写日志主题页 |
| `monthly` | 月结主题页 |
| `retro` | 实习总结主题页 |
| `rules` | 规则维护主题页 |
| `organize` | 主题笔记整理主题页 |
| 其他 | 回退精简入口页，末尾列出可用主题 |

## 读取状态

按插件根目录的 `references/workspace.md`（`${CLAUDE_PLUGIN_ROOT}/references/workspace.md`）读项目根目录的 `.claude/internflow.local.md`。只读，不创建。

逐项检测，用相对路径或文件名，不显示完整绝对路径：

| 项 | 检测方式 | 显示 |
|---|---|---|
| 配置 | 文件存在且 frontmatter 可解析 | `.claude/internflow.local.md` |
| 规则 | `rules` 指向的文件存在 | 文件名，如 `规则.md` |
| 日志根 | `log_root` 指向的目录存在 | 「已配置」，不显示路径 |
| 实习目录 | `log_root` 下 `<入职年月>-<公司名>-<岗位>/` | 相对 `log_root` 的路径；多个时全部列出 |
| 当月日志 | 实习目录下最新的 `YYYY-MM.md` | 文件名 + 最新一条记录日期 |
| 本月小结 | 当月及更早月份的 `## 本月小结` | 正常 / 空 / 缺失 |
| 素材库 | 实习目录下 `素材库.md` | 案例数 |
| 实习总结 | 实习目录下 `实习总结.md` | 存在 / 未生成 |

检测注意：

- 「最新一条记录」在 `## 本月小结` 之后的最前面，不是文件末尾
- 「已结束月份」指早于当前月份的月份；当月未结束，不算已结束
- 配置缺失或损坏时只显示「未找到」，不猜、不修复
- 多个实习目录时，状态区全部列出，下一步不指向具体命令
- 版本从 `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` 读 `version`；读不到写「版本未知」

## 输出：精简入口页

```text
internflow <版本>

状态
  配置      ✓ .claude/internflow.local.md
  规则      ✓ 规则.md
  日志根    ✓ 已配置
  实习目录  成都弗来科技/2026-10-Java实习
  当月日志  ✓ 2026-11.md，最新一条 2026-11-13
  本月小结  ! 2026-10 已结束，未生成
  素材库    ✓ 3 条
  实习总结  - 未生成

下一步
  1. 今天还没写日志：/internflow:log
  2. 2026-10 已结束但没有月结：/internflow:monthly 2026-10

命令
  第一次
    /internflow:rule-init          定规则、写配置
  日常
    /internflow:log                写当天日志
    /internflow:review             审日志（只读）
    /internflow:monthly            月底月结
  收尾
    /internflow:retro              实习结束总结
  整理
    /internflow:organize           主题笔记按模式分目录
  维护
    /internflow:rule-maintain      改规则并同步 skill
  帮助
    /internflow:help [config|log|monthly|retro|rules|organize|all]

更多：/internflow:help all
```

## 下一步优先级

按顺序取最靠前的未满足项，最多列三条：

1. 配置缺失：「未检测到配置。运行任一执行 skill 会询问规则文件和日志根目录；要从零定规则，用 `/internflow:rule-init`」
2. 规则文件不存在：「规则文件找不到，下次运行执行 skill 时给新路径」
3. 多个实习目录：「日志根下有多段实习，先选一段再执行」
4. 当月没有日志：提示写今天的日志
5. 当月最新一条不是今天：提示写今天的日志
6. 已结束月份缺本月小结：提示补月结，指明月份
7. 存在已结束月份且没有实习总结：「如果实习已结束，可以运行 `/internflow:retro`」
8. 都满足：「当前没有待办，可以直接写日志或审日志」

「实习是否结束」无法自动判断，只给建议，不下结论。

## 完整入口页

`all` 在精简页后追加：

```text
约定
  配置   项目根 .claude/internflow.local.md
  数据   <日志根>/<入职年月>-<公司名>-<岗位>/{YYYY-MM.md, 素材库.md, 实习总结.md, 主题笔记/}
  日志   「今日做了什么」分主线、产出、判断、推进
  范围   插件管到实习总结；正式简历不在范围内

主题
  /internflow:help config    配置位置与修改方式
  /internflow:help log       日志结构与写法
  /internflow:help monthly   月结的输入、产出和时机
  /internflow:help retro     实习总结的输入、产出和时机
  /internflow:help rules     规则、流程和执行 skill 的分工
  /internflow:help organize  主题笔记的分组模式和整理方式
```

## 主题页

### config

```text
配置
  位置    .claude/internflow.local.md
  当前    rules = 规则.md
          log_root = 已配置

修改
  - 直接编辑文件，路径用正斜杠、双引号
  - 或运行任一 skill 时给出新路径，校验后更新

注意
  - 配置含本地绝对路径，不要提交
  - .gitignore 应包含 .claude/*.local.md
  - 换项目目录启动时读不到，会重新询问
```

未配置时只显示位置和修改方式，不显示「当前」。

### log

```text
写日志：/internflow:log

「今日做了什么」分四层
  主线  当天最值得记住的一件事，由你确认
  产出  可交付物或状态改变
  判断  做的选择、确认或否定的结论
  推进  联调、测试、开会、看文档等支撑动作

没有产出时，主线写「今天没有可交付产出，主要在推进 X」。
只记公司工作内容；个人项目和生活内容跳过，跳过的东西本次对话内可以加回。
```

### monthly

```text
月结：/internflow:monthly [YYYY-MM]

读当月日志，写本月小结，挑案例进素材库。
月底运行；月中运行会说明是阶段性小结。
已有小结时先展示，确认后才覆盖。
```

### retro

```text
实习总结：/internflow:retro

读全部月结的「未解决」、素材库和日志，逐条确认终态，
产出简历素材、面试提纲、能力清单、待学习和已解决事项。
写到实习目录下的 实习总结.md。

产出是素材，不是成稿；正式简历不在插件范围内。
```

### rules

```text
规则与流程
  内容标准  规则文件，唯一源
  流程      执行 skill
  实现细节  执行 skill

改规则：/internflow:rule-maintain
它会把改动同步到四个执行 skill 和 README。
```

### organize

```text
主题笔记整理：/internflow:organize [module|type|--mode]

按配置的 topic_grouping 把主题笔记归入一层子目录。
  无参数   整理根目录平铺文件和未分组
  带参数   按新模式重排全部目录，成功后问是否写回配置
  --mode   只改配置，不移动文件

修改模式：直接改配置里的 topic_grouping，或运行 --mode 重选。
自由文本模式由 AI 按字面理解，结果不稳定；需要确定性时用 module 或 type。
```

## 通用约束

- 只读，不写文件、不建目录、不创建配置
- 不读规则内容，只检查文件是否存在
- 不复述规则里的数字和条款
- 状态检测失败时说明原因，不猜
- 不显示完整绝对路径；需要路径时只显示文件名或相对路径
- 不调用其他 skill

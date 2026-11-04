# Changelog

## 0.2.0（2026-11-04）

### 变更

- 工作区配置从 `.claude/internflow/config.json` 改为 `.claude/internflow.local.md`（YAML frontmatter），符合 Claude Code 插件本地设置惯例，配 `.gitignore` 的 `.claude/*.local.md` 规则防止误提交
- 旧配置不再自动读取；首次运行按无配置处理并重新询问，用户可以自行删除旧文件

### 修复

- `rule-maintain` 运行校验脚本改用 `${CLAUDE_PLUGIN_ROOT}/scripts/check.mjs`，避免在用户项目根找不到脚本
- `rule-maintain` 的 README 指代限定为插件根目录，并把定位规则文件提到读取全文之前
- 移除 skill 中对规则数字的中文复述，改回「按规则第 X 节」引用
- `internship-log` 明确「一次只问一个问题」与开场批量核对「明天」的例外关系
- `internship-log` 明确「第几天」的起算方式，月末提醒按被写日期判断
- `rule-init` 与 `rule-maintain` 的触发词不再重叠；访谈条目拆成单问；待同步清单定义格式

### 改进

- `check.mjs` 增加中文数字复述、旧配置路径、marketplace 条目版本和更广范围的真实路径扫描
- GitHub Actions 在结构校验后运行三项官方 `claude plugin validate`

## 0.1.0（2026-11-02）

### 新增

- 五个 skill：写日志、审核、月结、规则初始化、规则维护
- 项目根 `.claude/internflow/config.json` 工作区配置，自动保存规则文件与日志根目录
- 规则、日志、素材库模板
- `scripts/check.mjs` 结构校验与 GitHub Actions 工作流
- `tests/regression/` 人工回归样例，覆盖写、审、月结、改规则和配置

### 修复

- skill 不再复述规则里的数字，统一回到「按规则第 X 节」引用
- 工作区配置的路径写入前校验存在性，避免把错误路径持久化
- 文档示例路径改为占位符
- 整月审核检查已结束月份是否缺少本月小结
- 月结覆盖已有小结前先展示并确认

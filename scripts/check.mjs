#!/usr/bin/env node
// 插件结构与一致性校验，不依赖外部包。本地运行：node scripts/check.mjs
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);

const read = (rel) => {
  const path = join(root, rel);
  if (!existsSync(path)) {
    fail(`缺少文件：${rel}`);
    return null;
  }
  return readFileSync(path, 'utf8');
};

const readJson = (rel) => {
  const text = read(rel);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${rel} 不是合法 JSON：${error.message}`);
    return null;
  }
};

const plugin = readJson('.claude-plugin/plugin.json');
if (plugin) {
  for (const key of ['name', 'description', 'version']) {
    if (typeof plugin[key] !== 'string' || plugin[key].trim() === '') {
      fail(`plugin.json 缺少字段 ${key}`);
    }
  }
  if (plugin.name !== 'internflow') fail('plugin.json 的 name 必须是 internflow');
  if (!/^\d+\.\d+\.\d+$/.test(plugin.version ?? '')) fail('plugin.json 的 version 不是 x.y.z');
}

const market = readJson('.claude-plugin/marketplace.json');
if (market) {
  if (!Array.isArray(market.plugins) || market.plugins.length === 0) {
    fail('marketplace.json 缺少 plugins');
  } else {
    const entry = market.plugins.find((item) => item.name === plugin?.name);
    if (!entry) {
      fail(`marketplace.json 没有与 plugin.json 同名的条目（${plugin?.name}）`);
    } else {
      if (!existsSync(resolve(root, entry.source))) {
        fail(`marketplace 条目 source 不存在：${entry.source}`);
      }
      if (plugin?.version && entry.version !== plugin.version) {
        fail(`marketplace 条目 version (${entry.version ?? '未设置'}) 与 plugin.json (${plugin.version}) 不一致`);
      }
    }
  }
  if (market.metadata?.version && plugin?.version && market.metadata.version !== plugin.version) {
    fail(`marketplace metadata.version (${market.metadata.version}) 与 plugin.json (${plugin.version}) 不一致`);
  }
}

const template = read('templates/规则.template.md') ?? '';
const sectionNames = [];
let inFence = false;
for (const line of template.split(/\r?\n/)) {
  if (/^```/.test(line)) {
    inFence = !inFence;
    continue;
  }
  if (inFence) continue;
  const match = /^##\s+(.+?)\s*$/.exec(line);
  if (match) sectionNames.push(match[1]);
}
if (sectionNames.length !== 11) {
  fail(`规则模板应有 11 个二级章节，实际 ${sectionNames.length}`);
}

const skillsDir = join(root, 'skills');
const skillDirs = existsSync(skillsDir)
  ? readdirSync(skillsDir).filter((name) => statSync(join(skillsDir, name)).isDirectory())
  : [];
if (skillDirs.length === 0) fail('skills/ 下没有 skill');

const requiredSkills = [
  'internship-log',
  'internship-log-review',
  'internship-log-monthly',
  'internship-log-retro',
  'internship-log-rule-init',
  'internship-log-rule-maintain',
];
for (const name of requiredSkills) {
  if (!skillDirs.includes(name)) fail(`缺少 skill：${name}`);
}

const skillTexts = {};
for (const dir of skillDirs) {
  const rel = `skills/${dir}/SKILL.md`;
  const text = read(rel);
  if (text === null) continue;
  skillTexts[dir] = text;

  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!frontmatter) {
    fail(`${rel} 缺少 frontmatter`);
    continue;
  }
  const name = /^name:\s*(.+?)\s*$/m.exec(frontmatter[1]);
  const description = /^description:\s*(.+?)\s*$/m.exec(frontmatter[1]);
  if (!name) fail(`${rel} 缺少 name`);
  else if (name[1] !== dir) fail(`${rel} 的 name (${name[1]}) 与目录名 (${dir}) 不一致`);
  if (!description || description[1].length < 10) fail(`${rel} 的 description 缺失或过短`);

  for (const match of text.matchAll(/规则第\s*(\d+)\s*节/g)) {
    const number = Number(match[1]);
    if (number < 1 || number > sectionNames.length) {
      fail(`${rel} 引用「规则第 ${number} 节」超出 1-${sectionNames.length}`);
    }
  }
  for (const match of text.matchAll(/规则第\s*\d+\s*节[「『]([^」』]+)[」』]/g)) {
    if (!sectionNames.includes(match[1].trim())) {
      fail(`${rel} 引用章节名「${match[1]}」不在规则模板中`);
    }
  }
  for (const match of text.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`)）]+)/g)) {
    const target = match[1].replace(/[，。；,.;]+$/, '');
    if (!existsSync(join(root, target))) {
      fail(`${rel} 引用不存在的插件内路径：${target}`);
    }
  }
}

for (const name of requiredSkills) {
  const text = skillTexts[name];
  if (!text) continue;
  if (!text.includes('${CLAUDE_PLUGIN_ROOT}/references/workspace.md')) {
    fail(`skills/${name}/SKILL.md 没有引用 references/workspace.md`);
  }
  if (!text.includes('.claude/internflow.local.md')) {
    fail(`skills/${name}/SKILL.md 没有引用工作区配置 .claude/internflow.local.md`);
  }
  if (text.includes('.claude/internflow/config.json')) {
    fail(`skills/${name}/SKILL.md 仍引用旧配置路径 .claude/internflow/config.json`);
  }
}

const readme = read('README.md') ?? '';
const tableRows = [...readme.matchAll(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|$/gm)];
if (tableRows.length !== sectionNames.length) {
  fail(`README 规则章节表应有 ${sectionNames.length} 行，实际 ${tableRows.length}`);
} else {
  tableRows.forEach((row, index) => {
    const expectedNumber = index + 1;
    if (Number(row[1]) !== expectedNumber) {
      fail(`README 规则章节表第 ${expectedNumber} 行节号应为 ${expectedNumber}，实际 ${row[1]}`);
    }
    if (row[2].trim() !== sectionNames[index]) {
      fail(`README 规则章节表第 ${expectedNumber} 行章节名应为「${sectionNames[index]}」，实际「${row[2].trim()}」`);
    }
  });
}

const realPathPatterns = [
  /[A-Za-z]:[\\/][^\s"'`）)<>]*学习/,
  /[A-Za-z]:[\\/]Users[\\/]/i,
  /[A-Za-z]:[\\/]projects[\\/]/i,
  /\/Users\/[^/\s]+/,
  /\/home\/[^/\s]+/,
];
const pathScanFiles = [
  'README.md',
  'references/workspace.md',
  'tests/regression/README.md',
  'templates/规则.template.md',
  'templates/日志.template.md',
  'templates/素材库.template.md',
  'templates/实习总结.template.md',
  'CHANGELOG.md',
  ...skillDirs.map((dir) => `skills/${dir}/SKILL.md`),
];
for (const rel of pathScanFiles) {
  const text = rel === 'README.md' ? readme : read(rel);
  if (text === null) continue;
  for (const match of text.matchAll(/[A-Za-z]:[\\/][^\s"'`）)<>]+|\/(?:Users|home)\/[^\s"'`）)<>]+/g)) {
    if (realPathPatterns.some((pattern) => pattern.test(match[0]))) {
      fail(`${rel} 含真实本地路径，示例应使用占位符：${match[0]}`);
    }
  }
}

for (const rel of [
  'LICENSE',
  '.gitignore',
  '.gitattributes',
  'CHANGELOG.md',
  'templates/日志.template.md',
  'templates/素材库.template.md',
  'templates/实习总结.template.md',
  'tests/regression/README.md',
]) {
  if (!existsSync(join(root, rel))) fail(`缺少必要文件：${rel}`);
}

const gitignore = read('.gitignore') ?? '';
const gitignoreLines = gitignore.split(/\r?\n/).map((line) => line.trim());
const guarded = ['规则.md', '素材库.md', '主题笔记/', '架构图/', '20??-??.md'];
for (const pattern of guarded) {
  if (!gitignoreLines.includes(pattern)) {
    fail(`.gitignore 缺少用户数据防护：${pattern}`);
  }
}
for (const pattern of ['.claude/*.local.md', '.claude/*.local.json']) {
  if (!gitignoreLines.includes(pattern)) {
    fail(`.gitignore 缺少插件本地配置防护：${pattern}`);
  }
}

const restatements = [
  { pattern: /(?:^|[^\d])7-9\s*轮/, tip: '提问轮数应由规则第 8 节定义' },
  { pattern: /最多\s*3\s*条/, tip: '「明天」条数应由规则第 4 节第 5 条定义' },
  { pattern: /最多(留)?\s*五\s*条/, tip: '未解决条数应由规则第 10 节第 5 条定义' },
  { pattern: /[一二三四五六七八九十两]+\s*轮/, tip: '提问轮数应由规则第 8 节定义', allowThreshold: true },
  { pattern: /(?:必问|必写|必填)\s*[一二三四五六七八九十两]+\s*项/, tip: '必写项数应由规则定义' },
  { pattern: /[一二三四五六七八九十两]+\s*项\s*(?:小结|字段|内容|要素|数据)/, tip: '小结项或素材库字段数应由规则第 10 节定义' },
  { pattern: /(?:凑满|填满|写满)\s*[一二三四五六七八九十两]+\s*块/, tip: '日志分块应由规则第 4 节定义' },
  { pattern: /[一二三四五六七八九十两]+\s*块\s*(?:组织|结构)/, tip: '日志分块应由规则第 4 节定义' },
  { pattern: /(?:最多|不超过|至多)\s*[一二三四五六七八九十两]+\s*(?:条|项|点|轮)/, tip: '数量上限应由规则定义' },
];
for (const [dir, text] of Object.entries(skillTexts)) {
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    for (const { pattern, tip, allowThreshold } of restatements) {
      if (allowThreshold && line.includes('操作阈值')) continue;
      if (pattern.test(line)) {
        fail(`skills/${dir}/SKILL.md:${index + 1} 复述了规则数字：${tip}`);
      }
    }
  }
}

for (const warning of warnings) console.warn(`警告：${warning}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`错误：${error}`);
  console.error(`\n校验失败：${errors.length} 个错误`);
  process.exit(1);
}
console.log(`校验通过：${skillDirs.length} 个 skill，${sectionNames.length} 个规则章节`);

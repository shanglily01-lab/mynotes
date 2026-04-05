# Self-Growth App

AI 驱动的个人自学平台。每日自动抓取学术/新闻 RSS 源，用 Google Gemini 生成中文摘要和学习计划，每周出题考试并给出 AI 评估反馈。

---

## 功能概览

- **每日内容抓取**：RSS 聚合 + AI 生成 200 字中文摘要
- **每日学习计划**：AI 融合最新文章与基础主题，生成每学科 300 字学习任务
- **打卡完成**：逐条标记学习项，跟踪当日进度
- **每周考试**：AI 根据本周学习内容出题（每学科 4 道单选题）
- **AI 评估**：提交考试后，针对错题给出学习建议
- **进度追踪**：按学科展示周度得分与 AI 评语
- **学科材料**：AI 生成的学科学习指南（Markdown 格式）

---

## 学科配置

| 学科 | RSS 来源 | 基础主题数 |
|------|----------|-----------|
| 心理学 | Psychology Today, ArXiv Neuroscience | 11 |
| 生物学 | Nature, Science Daily | 10 |
| 物理学 | ArXiv Physics, Physics World | 10 |
| 社会学 | Sociological Imagination, ArXiv Social | 10 |
| 人工智能 | ArXiv cs.AI, ArXiv cs.LG, HuggingFace Blog | 10 |
| 英语 | BBC 6 Minute English, VOA Learning English | 10 |
| 每日新闻 | BBC World, NYT World, Reuters, The Guardian | — |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| 数据库 | MySQL + Prisma 6 ORM |
| AI 模型 | Google Gemini 2.5-flash (`@google/generative-ai`) |
| 样式 | Tailwind CSS 4 |
| 定时任务 | node-cron |
| Markdown 渲染 | react-markdown + remark-gfm |
| 包管理 | pnpm |

---

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# MySQL 连接串
DATABASE_URL="mysql://user:password@localhost:3306/self_growth"

# Google Gemini API Key（注意：.env.example 中的变量名有误，实际使用的是 google-key）
google-key="AIza..."
```

> **注意**：代码中读取的环境变量是 `process.env["google-key"]`，不是 `.env.example` 中写的 `ANTHROPIC_API_KEY`，请以实际代码为准。

### 3. 初始化数据库

```bash
# 运行迁移
pnpm db:migrate

# 写入初始学科数据
pnpm db:seed

# 重新生成 Prisma 客户端类型（迁移后如需）
pnpm db:generate
```

### 4. 启动开发服务器

```bash
pnpm dev
```

服务运行在 [http://localhost:3010](http://localhost:3010)

---

## 生产部署

```bash
pnpm build
pnpm start   # 监听 3010 端口
```

生产环境需配置 `NEXT_PUBLIC_BASE_URL` 环境变量，供定时任务调用自身 API：

```env
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
```

---

## 项目结构

```
self-growth-app/
├── app/                        # Next.js App Router
│   ├── api/
│   │   ├── content/fetch/      # RSS 抓取 + AI 摘要
│   │   ├── exam/               # 考试生成、查询、提交
│   │   ├── plan/               # 每日计划生成、打卡
│   │   ├── progress/           # 进度查询
│   │   └── subjects/           # 学科及文章查询
│   ├── exam/                   # 考试页面
│   ├── plan/                   # 每日计划页面
│   ├── progress/               # 进度页面
│   ├── subjects/[slug]/        # 学科详情页
│   ├── layout.tsx              # 根布局（含 Navbar）
│   └── page.tsx                # 仪表盘首页
├── components/
│   ├── dashboard/SubjectCard.tsx
│   ├── exam/QuestionCard.tsx
│   ├── layout/Navbar.tsx
│   └── plan/PlanCard.tsx
├── lib/
│   ├── claude.ts               # AI 调用函数（实际使用 Gemini）
│   ├── db.ts                   # Prisma 客户端（含 30s 心跳保活）
│   ├── filestore.ts            # 文件系统存储工具
│   ├── rss.ts                  # RSS 解析与文章抓取
│   └── subjects.ts             # 学科配置与日期工具函数
├── prisma/
│   ├── schema.prisma           # 数据模型
│   ├── seed.ts                 # 数据库初始化脚本
│   └── migrations/             # 迁移历史
├── data/                       # AI 生成内容（运行时创建，不进 git）
│   ├── articles/               # 文章摘要 .txt
│   ├── plans/                  # 计划条目内容 .txt
│   ├── exams/                  # 考题内容 .txt
│   ├── progress/               # 评估报告 .txt
│   └── materials/              # 学科学习指南 .txt
├── scripts/                    # 独立调试脚本
├── instrumentation.ts          # Cron 任务注册（Next.js instrumentation hook）
└── .env.example
```

---

## 数据模型

```
Subject           学科
  └── SubjectMaterial    学科学习指南路径
  └── Article[]          文章（URL 唯一）
  └── PlanItem[]         学习计划条目

DailyPlan         每日计划（date 唯一）
  └── PlanItem[]

Exam              每周考试（weekStart 唯一）
  └── ExamQuestion[]
        └── UserAnswer

Progress          每周进度（subjectId + weekStart 唯一）
```

### 混合存储策略

数据库只存结构化字段和文件路径，AI 生成的长文本（摘要、计划内容、题目正文、评估报告）写入 `data/` 目录下的 `.txt` 文件，通过 `*Path` 字段关联。

---

## 定时任务

在 `instrumentation.ts` 中注册，仅在 Node.js 运行时执行：

| Cron | 时间 | 动作 |
|------|------|------|
| `0 0 * * *` | UTC 00:00 / 北京 08:00 | 拉取 RSS + 生成当日计划 |

---

## AI 集成（lib/claude.ts）

所有 AI 调用均经过统一的 `ask()` 函数，具备：
- 5 次指数退避重试（网络错误时，间隔 3s/6s/9s/12s/15s）
- 支持 JSON Mode（`responseMimeType: "application/json"`）

| 导出函数 | 用途 | maxTokens |
|----------|------|-----------|
| `summarizeArticle` | 生成文章 200 字中文摘要 | 1024 |
| `generateDailyPlan` | 生成每日学习计划 JSON | 8192 |
| `generateExamQuestions` | 生成周考题目 JSON | 8192 |
| `generateEvaluation` | 生成错题评估建议 JSON | 1024 |
| `generateSubjectMaterial` | 生成学科学习指南 Markdown | 12288 |

---

## 常用命令

```bash
pnpm dev              # 开发服务器（端口 3010）
pnpm build            # 生产构建
pnpm start            # 生产启动（端口 3010）
pnpm lint             # ESLint 检查
pnpm db:migrate       # 运行数据库迁移
pnpm db:seed          # 初始化学科数据
pnpm db:generate      # 重新生成 Prisma 类型
```

---

## 已知问题

- `.env.example` 中 `ANTHROPIC_API_KEY` 变量名有误，实际代码读取 `process.env["google-key"]`，需手动在 `.env` 中使用正确名称
- `data/` 目录需要在部署环境中可写，文件与数据库记录需保持同步
- 无用户认证，为单用户设计
- MySQL `wait_timeout` 较短时依赖 30s 心跳保活，云数据库部署时注意配置

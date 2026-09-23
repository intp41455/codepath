# 循码 Codepath

> 面向零基础学习者的中文实践课堂。讲一个 → 练一个 → 测一个 → 复一个，把「看懂了」变成「我会了」。

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![no-build](https://img.shields.io/badge/build-none%20%7C%20pure%20static-8e44ad.svg)](#本地运行)

> **在线体验**：[循码网站](https://codepath-intpj-0922.bright-melon-8461.chatgpt.site/)（首次运行 Python/SQL 需联网加载浏览器执行环境）

**30 条学习路径 · 232 个小节 · 30 节先修衔接课 · 6 个游戏关卡 · 17 个综合项目 · 14 个每日挑战**

课程在浏览器里真实运行 Python、SQL、JavaScript、TypeScript（Pyodide + SQLite + 真实 TS 5.9.3 编译器），并配有两套「拿证据说话」的毕业验收：接管自己的 AI 辅助项目，以及分析和修改陌生 GitHub 项目。

## v4 先修与 AI 路线

每个模块新增出发前衔接课、直接先修导航与进度；词典放到代码之前，概念课不再要求运行示意文字。
新增10模块：AI数学、神经网络、深度学习、NLP、大模型部署、微调、LoRA、QLoRA、知识图谱、RAG。
13道新Python题有行为断言和未完成答案反例；另有概念题、手算、阅读与本机任务。
`labs/README.md` 提供解压、终端、虚拟环境、实验运行和故障检查步骤。运行 `python scripts/build-model-labs.py` 生成下载包。
真实GPU微调和真实本地模型服务没有在本次环境实测，课程明确区分原理实验、配置阅读与真实模型实验。课程数量与XP不保证精通，需通过独立修改和项目证据检验。

## 为什么做这个项目（背景）

很多「学编程」卡在两个地方：一是只看不练，代码看着都懂，一写就错；二是练习环境门槛高，装环境、配依赖就把人劝退了。循码 Codepath 想把这两点都压到最低：

- **零安装**：打开网页就能跑真实代码，Python/SQL/JS/TS 全部在浏览器内完成，无需任何后端。
- **边学边练**：每一节都是「讲解 → 动手 → 运行检查 → 复盘」闭环，练习带真实断言，能区分「写对了」「没写」和「业务写错」。
- **诚实的证据**：项目验收和毕业自评要求真实代码 + 运行 + 测试证据，网站只检查填写完整度，不冒充第三方能力认证。

想快速上手请看 [使用文档 →](docs/使用文档.md)；想理解课程结构与内部模块请看 [架构说明 →](docs/架构.md)；完整背景见 [项目背景 →](docs/项目背景.md)。

## 开始学习

直接打开发布的网站，从“零号训练营”的点击、焦点与安全练习开始。右侧填写代码，点击「运行并检查」。按课程顺序完成讲解、练习与复盘，再进入实战项目。

- **67 个 Python 练习** 和 **7 个 SQL 练习** 使用真实 Pyodide / SQLite 在浏览器中运行；**9 个 JavaScript、7 个 TypeScript** 在隔离环境执行。首次运行需要联网下载环境。
- **142 个概念或本机指导小节** 涵盖开发工具、Java、FastAPI、Spring Boot、Spring AI、Linux、源码阅读与复杂项目工程。网页提供步骤与知识检查，不代替本机编译或项目验收。
- Agent 与多角色基础练习明确使用确定性模拟；真实模型集成在本机项目阶段进行。**网站本身没有接入聊天模型**；审核中心可运行单文件 JS/TS/Python 与业务断言、提示部分静态风险，不会自动审查整个任意仓库。
- 课程、草稿、笔记、项目检查与毕业自评保存在当前浏览器。用页面底部的「备份学习进度」导出，再在其他浏览器导入。

## 本地运行

这是普通静态网站，无需 `npm install` 或构建。

```powershell
# 方式一：Node（零依赖，仓库自带脚本）
npm start
# 或手动：node scripts/serve.cjs 4317

# 方式二：Python
cd dist
py -m http.server 4317 --bind 127.0.0.1
```

打开 http://127.0.0.1:4317 。直接双击 HTML 可能受浏览器 Worker 的文件来源限制，因此代码运行需要 HTTP / HTTPS。

## 运行测试（可复现）

```bash
node --test tests/regression.cjs      # 浏览器课程断言 + 业务逻辑 + 静态规则（当前 63/63）
python tests/exercises.py             # 67 Python + 7 SQL 参考实现（74 通过）
python tests/runtime-python.py        # 运行时参考 + 反例
python scripts/build-test-bundle.py  # 重新生成 dist/codepath-tests.zip
```

`node` 与 `python` 均无需安装依赖：TypeScript 编译器 5.9.3 已附带于 `dist/vendor/typescript/`（许可见其目录内 `LICENSE.txt`）。

## 文件结构

```
codepath/
├─ README.md / CHANGELOG.md / CONTRIBUTING.md / LICENSE
├─ package.json            # npm start / test 入口（零依赖）
├─ .editorconfig / .gitignore / .nojekyll
├─ docs/
│  ├─ 项目背景.md           # 项目缘起、边界、目标
│  ├─ 使用文档.md           # 学习者与贡献者操作指南
│  └─ 架构.md              # 模块与数据流说明
├─ dist/                  # 站点本体（静态）
│  ├─ index.html          # 入口
│  ├─ style.css           # 桌面 + 手机布局
│  ├─ curriculum.js … new-courses.js / new-projects.js / daily.js   # 逐课内容
│  ├─ learning-core.js    # 纯业务逻辑（XP/去重/归一/扫描），被页面与测试共享
│  ├─ runner.js / js-runner.js / sandbox.js   # 隔离执行器（Pyodide / JS·TS / 不透明 iframe+Worker）
│  ├─ app.js / learning-hub.js / capstones.js / export-dialog.js    # 路由、审核、毕业、导出
│  ├─ test-report.html    # 实测报告
│  ├─ codepath-tests.zip  # 可下载测试包（build-test-bundle.py 生成）
│  └─ vendor/typescript/  # 随仓库分发的 TS 5.9.3 编译器
├─ tests/                 # Node 回归 + Python 参考实现
└─ scripts/               # 导出 / 打包 / 本地服务脚本
```

## 学习路径一览（20）

Python 基础 → 数据结构与算法 → SQL 与数据库 → 开发工具与工程基础 → Linux · 从终端到服务排障 → JavaScript · 网页开始行动 → TypeScript · 为代码建立约定 → FastAPI 接口开发 → Java 与面向对象 → Spring Boot 应用开发 → Spring AI 应用集成 → Agent 与检索增强 → 多 Agent 协作 → 智能体系统 · 架构与协作 → GitHub 源码阅读与分析 → AI 代码理解与接管 → 复杂项目的工程能力。

## 内容边界与诚实声明

- 课程提供从入门到独立实践的训练路线，**不承诺**仅凭阅读或打卡就精通全部技术。
- Spring 与模型提供方配置会随版本变化；安装时应核对生成器与文档版本。
- 静态安全扫描是启发式，不是完整漏洞审计或生产安全保证。
- 学习参考代码不是具备鉴权、限流、生产监控等全部能力的商业系统。

内容核对日期：2026-09-22。

## 许可

本项目按 [MIT 许可证](LICENSE) 开源。随仓库分发的 TypeScript 编译器保留其原有许可（`dist/vendor/typescript/LICENSE.txt`）。


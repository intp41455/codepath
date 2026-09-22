# 贡献指南（Contributing）

欢迎为「循码 Codepath」补充课程、修复问题或改进文档。这是一个纯静态站点，无需后端与构建工具链，因此贡献门槛很低：改文件 → 本地起服务 → 跑测试 → 提交。

## 环境要求
- 一个静态 HTTP 服务（Python / Node / 任意）；直接双击 HTML 会受浏览器 Worker 同源限制，代码运行必须走 HTTP/HTTPS。
- Node.js（跑回归测试）；Python 3（跑 Python/SQL 参考实现测试）。
- 无需 `npm install`：TypeScript 5.9.3 编译器已随仓库附带于 `dist/vendor/typescript/`。

## 快速开始
```bash
# 1) 本地起服务（在 dist 目录）
cd dist
python -m http.server 4317 --bind 127.0.0.1   # Windows 可改用 py -m http.server 4317
# 浏览器打开 http://127.0.0.1:4317

# 2) 回归测试（在仓库根目录）
node --test tests/regression.cjs
python tests/exercises.py
python tests/runtime-python.py

# 3) 重新生成可下载测试包（改动测试 / 课程后）
python scripts/build-test-bundle.py
```

## 代码在哪里
- **课程 / 项目内容**：`dist/*.js`（`curriculum`、`foundations`、`backend`、`ai-lessons`、`mastery`、`projects`、`new-courses`、`new-projects`、`daily`）。每个小节是一段结构化文本（讲解、练习、断言、复盘），不是生成占位符。
- **业务纯逻辑**：`dist/learning-core.js`（XP、每日奖励去重、状态归一化、备份合并、静态风险扫描）。被页面与回归测试共享。
- **隔离执行**：`dist/sandbox.js`（不透明源 iframe + 一次性 Worker）、`dist/runner.js`（Pyodide Python/SQL）、`dist/js-runner.js`（JS/TS strict 检查后执行）。
- **界面 / 路由**：`dist/app.js`、`dist/learning-hub.js`、`dist/capstones.js`、`dist/export-dialog.js`。
- **测试**：`tests/`（Node 回归 + Python 参考实现）、`scripts/`（导出与打包脚本）。

## 提交前自查（务必全绿）
1. `node --test tests/regression.cjs` 全部通过（当前基线 60/60）。
2. `python tests/exercises.py` 与 `python tests/runtime-python.py` 通过。
3. 新增 / 修改课程后，重新跑 `python scripts/build-test-bundle.py`，保证 `dist/codepath-tests.zip` 与测试一致。
4. 在真实浏览器里走一遍：做题 → 重复领奖不叠加 → 备份/导入 → JS/TS/Python 错误用例 → 无限循环可停止 → 窄屏布局。

## 课程内容的约束
- 每个可执行小节必须有能区分「正确 / 未完成 / 业务错误」的断言（`test` 或 `expected`）。
- 不要写「只检查代码里含某个单词」式的弱测试（参考 `tests/regression.cjs` 的负向用例）。
- 参考实现要能被修改后让测试失败——证明测试真的在验证行为。
- 本机指导类（`kind: 'guided'`）小节须含 `checks`（≥2 项）与 `quiz`，并明确「完成状态由学习者自查」。

## 风格与安全
- 纯 JavaScript，无框架依赖；沿用现有命名与文件组织，不要引入构建步骤。
- **不要在代码里写真实密钥 / 凭据**；示例占位符也要在文档里注明「非真实」。
- 用户输入优先用 `textContent`；富文本必须净化（见 `learning-core.js` 的 `html` 规则）。
- 静态风险规则是启发式，不等于安全审计；改规则时补充正 / 负向用例。

## 分支与提交信息
- 默认分支 `main`；小步提交，信息用「类型: 说明」（feat / fix / docs / test / chore / perf）。
- 涉及课程数据结构的改动，记得更新 `tests/regression.cjs` 里的数量与字段断言，并同步 `CHANGELOG.md`。

## 许可证
提交即表示你同意按仓库的 [MIT 许可证](LICENSE) 贡献。随仓库分发的第三方 TypeScript 编译器保留其原有许可（见 `dist/vendor/typescript/LICENSE.txt`）。

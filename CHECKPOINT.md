# 循码迭代存档

## 恢复后的发布验收（2026-09-22）

额度重置后已恢复。本轮完成 JS/TS/SQL 工作台、手动停止、审核修改失效、备份导入/无效文件拒绝、导出 JSON 预览/复制、375px 手机首页与审核/工作台布局验证。修复无断言误通过、旧运行结果、手机导航溢出和导出无反馈。JS 第二课补全函数与参数入门。Node 当前 60/60；实际 worker 内嵌 Python 51 参考解 + 7 反例通过。报告见 dist/test-report.html。接下来按既定 Sites 流程发布，发布结果另存工作区 outputs/发布记录.md。以下暂停记录保留为历史。

## 安全暂停：2026-09-22 本轮最终状态

用户要求额度接近耗尽时存档暂停。最后检查 usedPercent=85，剩余约 15%，现在暂停。线上仍为 v1，没有发布新版。

本地已实现 129 小节、17 路径、14 项目；新增 JS 12、TS 8、Linux 10、智能体系统 12。首页每日挑战 14 题轮换、每日唯一 +40 XP，课程首次完成 +20 XP。新增审核中心、静态风险扫描、JS/TS/Python 隔离运行与断言、人工可行性清单、记录导出。全课程追加独立解释/重做/调试/迁移自评。TS 5.9.3 编译器已附带许可。

已验证：Node 59/59；Python/SQLite 51 参考解通过、10 新算法 starter 拒绝；FastAPI pytest 5/5（2 弃用警告）。浏览器：每日题通过、重复不重复领奖；JS 错误业务拒绝；TS 类型错误拒绝及修正后通过；Python 通过；document 不可用、IndexedDB SecurityError；无限循环自动停止；首页桌面截图正常。具体见 dist/test-report.html。

恢复后待做：先查额度；课程工作台 JS/TS/SQL 实测、停止按钮、备份导入导出、审核编辑时取消旧执行的最后修复、窄屏。js-02 函数引入偏快，可补完整函数/参数/return 讲解。审查课程源链接。更新测试报告，重新打包 dist/codepath-tests.zip（排除 zip 本身），然后推送并发布同一私有站点。未发布前不可宣称线上已更新。

测试命令（仓库 cwd）：node --test tests/regression.cjs；Python 运行 tests/exercises.py。Python 可用绝对路径 C:\Users\intpj\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe。FastAPI 在 workspace 设置 PYTHONPATH=work/test-deps，运行该 Python -m pytest work/test_main.py -q --basetemp work/pytest-v2-temp。

预览：workspace 的 node work/preview.cjs，http://127.0.0.1:4317，最近 session 98454。浏览器 tab 3 已 markHandoff。没有修改线上学习记录。

发布恢复：get_site 已确认 owner-private。官方 Sites 0.1.70 helper Bearer Git 认证不兼容本库；work/site-workflow-fixed.mjs 改为 Basic x-access-token，仅 stdin/env 接 token，仍使用官方 metrics/packager，已成功 open/fetch 同一仓库。运行时进程环境 GIT_CONFIG_COUNT=1、GIT_CONFIG_KEY_0=http.sslBackend、GIT_CONFIG_VALUE_0=openssl（不关闭证书验证）。获取新 source credential，仓库 cwd 启动 helper tty=true，隐藏 stdin 输入 {credential,source:{project_id,checkout_path},commands:[],archivePath:绝对路径}。不得持久化或输出 token。返回准确 commit_sha/archive 后调用 save_version_and_deploy_private，再 poll get_deployment_status 到终态。不要 create_site。旧 token 已过期。本地最终提交是恢复点，尚未远程推送 v2。

以下为开工时基线记录：

2026-09-22：正在扩展现有网站，基线提交 0f291e21afc95d8d4613c1eb3ba997ab332055f9。

目标：JS、TS、Linux、智能体系统课程；每日挑战与 XP；代码审核与实际自动化测试；发布同一站点。

站点：appgprj_6ab1beac0dec81918e62eab27f96ead1。保留私有访问。

当前：原有 87 小节、13 路径、10 项目。五小时额度首次检查剩余 79%。尚未宣称新增内容完成。

恢复入口：dist/index.html；测试脚本在 scripts/ 与 tests/；验证完成后更新本文件。学习记录仍使用 codepath-learning-v1，须兼容原备份。

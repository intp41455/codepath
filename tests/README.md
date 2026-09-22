# 如何运行真正的回归测试

在此包根目录执行（需要 Node.js；Python 3 用于 Python/SQL 课程）：

```
node --test tests/regression.cjs
python tests/exercises.py
python tests/runtime-python.py
```

Windows 没有 `python` 命令时使用已安装 Python 的绝对路径。测试成功时退出码为 0，失败为非 0。无需 npm install；TypeScript 编译器 5.9.3 已附带，许可在 dist/vendor/typescript/LICENSE.txt。

Node 测试调用真实课程运行器、业务状态逻辑与规则扫描器，包含正确参考实现、未完成代码、错误类型、错误业务、输出洪水、备份兼容与每日奖励去重。Python 脚本执行本包作者编写的可信课程参考实现；不要拿它执行陌生代码，它不是沙箱。

先复制一份包再做故障注入：把 dist/learning-core.js 中 reward 的已领取保护改坏，测试必须失败；恢复后全部通过。修改课程函数的返回值，同样应看到对应测试失败。不要在生产文件上做此实验。

浏览器 E2E 需要另外实测：启动静态 HTTP 服务，打开 index.html；做题→重复领奖→刷新→备份/导入；JS/TS/Python 错误用例；无限循环停止；审核输入修改后结果失效；窄屏和键盘操作。Node 的结构检查不是浏览器隔离安全认证。

审核范围：启发式规则不是完整漏洞扫描；未覆盖 Java 编译、真实 Linux 部署、付费 LLM 调用、负载、供应链全量审计、跨设备同步。实际浏览器验证记录见 dist/test-report.html。

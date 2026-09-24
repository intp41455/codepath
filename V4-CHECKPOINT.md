# v4 历史暂停存档 · 2026-09-23

> 续作说明：下方为此前额度不足时的历史记录，已不代表当前进度。续作已完成CPU PyTorch实验（初始损失2.815189、最终0.000250、独立输入0.000044、重载一致）、概念课浏览器复核、手机布局复核及全部自动化回归。最新结果见 dist/test-report.html。发布状态以Sites部署记录为准。

用户要求：补各模块前置知识，新增大模型部署、微调、深度学习、神经网络、NLP、LoRA、QLoRA、知识图谱和RAG。此前要求5小时额度将尽时存档暂停。

本次额度最后读取：5小时已用92%，周额度已用67%。因此主动暂停，**尚未发布v4，线上仍为v3**。

## 已保存的改动
- 30个模块、232个小节、17个项目；本次新增75节：旧模块20节桥接 + 新模块55节（含10节桥接与45节主题课）。总桥接30节。
- 10个AI模块；新增13个可实际执行的Python原理题。
- 无循环先修关系图、先修导航、进度和回链；按先修排序。
- 词典前移；概念课隐藏代码编辑器；基础自评用简单语言。
- 4个本机实验脚本与逐步README：PyTorch小网络、标准库LoRA矩阵、标准库检索管道、本机Ollama客户端。
- 3个专项毕业项目。真实GPU微调与实际本地模型服务明确没有实测。

## 本次通过的验证
- npm run test:all：63项Node通过；74个Python/SQLite参考解通过；10个Agent与13个新AI未完成答案被拒绝。
- 实际浏览器worker中的Python程序：74个参考检查 + 7个反例通过。
- 标准库LoRA训练：初始损失23.333333，最终接近0；冻结底座、独立输入、保存重载通过；0步训练负例未误过。
- RAG权限前置过滤、无证据、未知角色与空问题检查通过。
- Ollama客户端只有模拟HTTP契约及错误路径测试，没有真实模型调用。
- 浏览器：RAG目录先修链接、桥接词典、答错反馈、答对+5XP已验证；rag-01初始空实现被拒绝，正确实现真实Python执行显示“练习检查通过”。
- 最后一次概念课隐藏编辑器的修改已通过JS语法与Node回归，但尚未浏览器复核；移动端尚未复测。

## 下一次继续
1. 先检查额度。读取本文件；源码以当前 outputs/codepath-site-v3 为准，不使用旧 outputs/codepath。
2. 完成PyTorch实验验证。曾尝试安装CPU torch到工作区 work/torch-runtime，下载较慢，暂停时终止安装；先检查安装是否完整，不要宣称已通过。Python路径见下。
3. 浏览器复核概念课编辑器确实隐藏、先修链接导航、首页新入口与窄屏；仅需补未验证项。
4. 如修改运行脚本，重新生成 model-labs.zip；更新测试报告中待验收部分，再生成 codepath-tests.zip。
5. 按Sites技能发布到原站点（public），不要创建新站或更换受众。先 get_site + 新凭据，运行工作流open，再发布。上一次open成功SHA是53262194e4f9f560cba72baa840dbd41e8d8d17c；本地未推送的改动均属于v4。
6. 工作流脚本 work/site-workflow-fixed.mjs 已修复Windows绝对路径和Git openssl。凭据只通过隐藏stdin，不写文件不打印。若打包器仍不兼容，参考work/publish-v3.cjs复制为v4归档路径，确认commit已推送，再tar静态资源、save、deploy、检查成功。
7. 原站点ID appgprj_6ab1beac0dec81918e62eab27f96ead1；URL https://codepath-intpj-0922.bright-melon-8461.chatgpt.site/ 。

Python解释器：C:\Users\intpj\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe

这版补了基础与课程入口，**不应声称已验证完整零基础到专家的教学效果**。课程含阅读与本机自查；真实GPU训练、生产部署、安全全面审计和真人学习效果仍须后续验证。

# AI 本机实验包：先理解，再运行

## 0. 先完成哪些课程
电脑基础 → Python慢速起步 → Python → 工程基础；训练实验再补AI数学、神经网络与深度学习。
不理解“目录”“终端”“虚拟环境”时先回到相应课，不要求照抄陌生命令。

## 1. 解压与打开（Windows）
1. 下载 ZIP，右键“全部解压缩”，选择自己的练习目录，例如 `Documents/codepath-labs`。
2. 打开解压后的文件夹，确认能看到 `labs` 文件夹。不是在 ZIP 预览窗口里运行。
3. 在文件夹空白处右键“在终端中打开”。下列命令输入终端，逐行执行，按回车。
4. 输入 `python --version`。应看到 Python 3 的版本；若找不到命令，先完成工程课Python安装，不继续猜命令。
5. 输入 `python labs/lora_toy.py`，应输出初始和最终损失以及 PASS。
6. 输入 `python labs/rag_lab.py`，应出现带 `hours-v1` 引用的证据与 PASS。
7. 找不到文件时输入 `dir` 检查是否在包含 labs 的目录。语法错误时核对文件有没有被误改。

这两个脚本只需 Python 标准库。它们是原理实验，不是大语言模型部署或微调认证。

## 2. PyTorch 实验
在同一目录：

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install torch
.venv\Scripts\python.exe labs/tiny_torch.py
```

第一行创建项目专用环境；第二行在这个环境安装库；第三行用这个环境执行脚本。这里直接使用环境中的解释器，不需要改变 PowerShell 执行策略。
安装前查看 https://pytorch.org/get-started/locally/ ，按当前系统和CPU选项选择兼容命令。此实验不要求GPU；下载体积与支持的Python版本以官方说明为准。
Linux/macOS 环境解释器通常为 `.venv/bin/python`。脚本每次使用同一随机种子，但不同库版本可能有小数值差异。
成功应看到损失下降、独立合成输入误差通过、重载前后预测一致。它证明小型合成任务运行，不证明真实业务效果。
保存重载使用临时目录，结束后自动清理实验检查点，不触碰你的项目数据。

## 3. 本地模型接口实验
按 https://docs.ollama.com/quickstart 安装并启动 Ollama。先选择资源与许可证合适的本地模型，不必购买显卡。
终端运行 `ollama list`，记下已安装本地模型完整名称。
运行 `python labs/local_chat.py`，根据提示输入名称与问题。
本脚本只请求 `127.0.0.1:11434`，不会启动或下载模型。请确认所选模型是本地模型；云模型可能由服务转发到云端，勿使用云模型做本地隐私实验。
连接拒绝先检查服务；HTTP错误核对模型名称；超时记录资源与上下文长度。
该真实模型实验需要你本机的服务与模型，本网站没有代你完成。

## 4. 修改、解释、验收
每次只改一个地方。先写预测，再运行，再比较。
- LoRA玩具实验：改变目标矩阵，使其增量不再是秩1，观察拟合限制；不要为了通过删除断言。
- RAG：加入一条有权限的文档，再加入只允许staff的文档，验证student看不到后者。
- PyTorch：减少训练次数，观察是否触发断言；解释zero_grad、backward、step分别做什么。
- 本地模型：故意填错模型名，记录可读错误；再恢复正确名字验证恢复。

交付：输入、设置、实际输出、失败案例、修复理由、仍未测试的部分。XP和自查勾选不能替代这些证据。

## 5. 真实 LoRA / QLoRA 的下一步
课程中的PEFT配置只是阅读片段，不能独立执行。GPU训练尚未在本项目验证。
先依次核对模型许可证、数据许可、模型结构、PyTorch/PEFT/量化后端版本和硬件支持：
- https://huggingface.co/docs/peft/quicktour
- https://huggingface.co/docs/peft/developer_guides/quantization
- https://huggingface.co/docs/bitsandbytes/main/en/installation

再按官方最小示例加载底座、注入适配器、确认可训练参数、小步训练、保存重载、与未训练基线对比。没有实测的显存、速度、效果请写“未测试”。

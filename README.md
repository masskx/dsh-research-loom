# 研序 · Research Loom

DeepSeek Harness 的学术科研插件：从读懂初稿、找到研究方向，到逐条返修，让下一步更清楚。

**不用记斜杠命令。打开论文工作台，选择你的场景，检查任务建议后发送即可。**

当前版本 **0.9.1** · 已验证宿主 **DSH 0.1.1-rc.2** · **CC-BY-NC-4.0（非商业）**

0.9.1 修复材料刷新：在同一会话手动新增、改名或删除文件后，点击 **材料 → 重新扫描** 即可更新，无需新建会话。升级后需重启 DSH 并刷新浏览器。

[安装](#安装插件) · [使用效果](#安装后会看到什么) · [三种使用流程](#选择你的使用场景) · [完整操作指南](docs/USAGE.zh-CN.md) · [安装排错](docs/INSTALL.zh-CN.md) · [后续计划](docs/ROADMAP.zh-CN.md)

## 安装插件

以下假设你**已经安装好 DeepSeek Harness**，终端能使用 `dsh`。无需重新安装宿主。
若还没安装，请先按 [DSH 官方说明](https://github.com/deepseek-ai/deepseek-harness)完成宿主安装。

在运行 DSH 的那台电脑（远程部署则是服务器）打开终端：

```bash
# 确认宿主版本；当前验证版本为 0.1.1-rc.2
dsh --version

# 先等待正在执行的任务结束，停止 dsh web，再安装插件
dsh plugin --profile web add github:masskx/dsh-research-loom

# 重新启动，打开终端显示的地址
dsh web
```

普通用户**不需要克隆仓库、安装 pnpm 或编译**。仓库自带构建产物；安装时需要能访问 GitHub 和包下载服务，并有可用的 Git 和宿主所需的 Node.js 环境。
安装与使用必须是同一个 DSH `web` profile。

内部包名保留 `dsh-academic-research-skills`，设置开关名称仍为 **Academic Research Skills**，以兼容已有用户。
请使用上述 GitHub 地址，不要安装同名 npm 包来代替本项目。

### 使用前只检查三件事

1. **选好工作区**：在 DSH 中添加或选择论文项目文件夹，并进入其对话。空文件夹也可以；不要求固定命名模板。
2. **模型可用**：普通 DSH 对话能正常回复。插件不提供 API Key 或额度；扫描路径不调用模型，发送生成任务会使用当前模型及额度。
3. **工具匹配任务**：读 PDF/DOCX 需要宿主可用的文档读取工具，联网研究需要检索工具及网络权限。插件不自带 OCR、数据库订阅或独立搜索服务；读不了可提供文本摘录，不能联网时可先用本地资料。

## 安装后会看到什么

进入论文工作区后，“论文工作台”入口出现在空白会话输入框上方，或已有会话标题栏。
点击后展开右侧栏，`×` 可收起。桌面布局为侧栏预留空间；极窄屏幕使用可关闭浮层。

首页只需选择 **已有论文 / 从零开始 / 论文返修**。每个入口提供三步引导，说明先准备什么、会得到什么；
“准备任务到对话框”会填入可编辑提示词，**不会自动发送**。研究结果在 DSH 主对话和工作区文件中查看，不在侧栏内另开聊天。

![新手入口：三种场景](docs/images/overview.png)

截图来自真实组件的隔离演示项目，不含私人论文，不代表模型已执行真实研究。

首页只展示当前任务，一个主要按钮。填入提示词后会提示你到主对话检查并发送；
任务下方的步骤选择框可随时切换，不需要逐步解锁。四个视图各司其职：

- **开始**：选择场景，准备当前任务；不展示评分和设置列表。
- **材料**：查看候选文件、纠正归类、限定扫描范围。文件名匹配不等于已读全文。
- **流程**：查看各模块已有与缺少的材料，选择论文类型、目标标准，并手动确认研究状态。不适用的阶段可以排除。
- **更多**：项目记忆、投稿指南、最近任务，以及评分、检索和迁移工具。

## 选择你的使用场景

### A. 已经有一篇自己的论文

1. 将自己的初稿及相关参考文献放入工作区。打开 **开始 → 已有论文 → 检查论文**。
2. 点击 **准备任务到对话框**，核对初稿路径、补充关注点，然后发送。助手先识别哪篇是你的稿件，再给结构诊断和优先修改清单。
3. 核验清单后，选择 **逐项改进**，每轮只处理确认的范围；保留原稿，核对新版本及修改依据。
4. 稿件准备好后选择 **准备投稿**，提供具体期刊/会议和作者指南，生成投稿检查清单。插件不会自动投稿。

如果你只有几篇别人发表的论文、还没有自己的初稿，请走下一场景的“收集与整理”。

### B. 刚开始科研，文件夹是空的

1. 创建空文件夹并在 DSH 打开，选择 **开始 → 从零开始 → 明确方向**。主题可以留空。
2. 准备任务、发送并回答少量澄清问题，先确定兴趣、资源和可行方向。
3. 选择 **收集与整理**：可把参考论文放进文件夹后在“材料”重新扫描，选择“只整理我提供的论文”；也可选择“联网检索”或“已有资料 + 补充检索”。发送前填好确认的研究主题。
4. 核验来源、文献矩阵和候选研究缺口，再选择 **制定研究计划**，明确方法、里程碑和近期可执行任务。

没有联网工具时不会凭空获得“最新论文”。搜索摘要、全文和无法访问的来源应明确区分，创新性判断需要证据。

### C. 收到审稿意见，需要返修

1. 将投稿原稿、编辑决定信和完整审稿意见放入工作区，选择 **开始 → 论文返修 → 梳理审稿意见**。
2. 发送任务，补充返修轮次和期限，核对保留审稿人及原编号的意见清单与返修计划。
3. 选择 **落实修改**：按确认计划生成修订新版本，逐条对应修改位置和证据；未做的实验/分析必须保持待办。
4. 选择 **核对回复信**：对照真实修改拟逐点回复，检查意见遗漏、页码/章节和返修附件，最终由作者审核与提交。

三种场景都能随时切换，不清空论文文件或项目记忆。**点下一步只是切换任务，不代表上一阶段完成。**
详细的准备材料、验收方法、常见卡点见 [使用指南](docs/USAGE.zh-CN.md)。

## 状态、评分和任务记录

### 审稿之后，不用再手工拼接下一轮提示词

0.9.0 新增 **审稿 → 修改 → 复核** 的最小闭环：

1. 在有审稿回复的同一个 DSH 会话，打开“开始”下方的 **已有审稿结果？接着修改与复核**。
2. 选择一份已结束的审稿回复（可预览），填写自己的原稿路径，点击 **整理这份审稿结果**。这会发送一次模型任务，读取原稿并提取结构化问题清单，不修改论文。
3. 查看问题、涉及章节和待补证据，填写 **本轮授权的文字修改范围**，点击 **授权本轮修改并执行**。
4. 保持工作台打开。默认自动执行“生成修订新版本 → 只读对照复核”，然后在侧栏显示已解决、部分解决和未解决项，以及修改证据。
5. 由作者核验结果。仍有文字问题可以再授权一轮；每个闭环最多两轮，不无限自评。真实实验、作者决策和最终投稿不会自动执行。

读取的是宿主中真实、已完成的助手正文，按请求标记、用户消息序号和回复轮次关联，不采集模型推理。
修改与复核要求独立新稿路径、保留全部原意见及编号；结果格式不完整、遗漏问题或缺证据会停止。
模型提供的修改证据仍须作者核验，插件尚未独立校验文件内容或执行确定性稿件差异审查。

**费用与暂停**：整理意见一次模型任务；每次授权最多再发两次任务（修改、复核），不是固定 token 或费用上限。
有草稿、无关新消息、失败或缺材料时不继续。收起工作台、刷新页面、关闭页面或切换工作区会撤销自动续行许可；
返回后可查看完成结果，必要时点“继续只读复核”。“暂停后续自动执行”不取消已发送任务，取消当前任务请使用 DSH 停止按钮。

每个工作区保存最近一个闭环（最多 7 条阶段记录），开始新闭环会替换当前记录；此前可 **导出本闭环记录** 备份。
记录含审稿正文摘要、问题与证据，保存在 DSH 设置中，不会自动上传 GitHub。普通项目快照不包含闭环记录和续行许可。
更多边界与操作说明见 [闭环使用指南](docs/REVIEW-LOOP.zh-CN.md)。

材料完整度是文件路径/类型的覆盖率，**不是论文质量或录用概率**。SCI/EI 只是建议量表，不是所有刊会共同的标准；
在“更多 → 具体投稿目标与作者指南”填写实际要求，在“流程”选择目标标准，再到“更多 → 更多工具”发起深度评分，仍需核验正文证据。

默认的新手任务只填入对话框，手动发送后在主对话检查结果；不会新增工作台任务追踪记录。
“流程 → 生成模块结果”或“更多工具”直接启动的任务才会进入“更多 → 最近任务”。输入框已有草稿时不会自动发送。
切换场景或重复准备任务，会替换上一段未编辑的插件提示词，保留它前后的手动文字；已修改或无法识别的草稿需确认后才替换，不再自动追加。刷新页面后无法识别旧提示词，也会先询问。
任务验收与研究阶段确认彼此独立，扫描不会替研究者确认阶段。

## 更新、停用与卸载

更新前等待任务结束并停止 `dsh web`：

```bash
dsh plugin --profile web add github:masskx/dsh-research-loom --force
dsh web
```

暂时停用：**设置 → 插件 → 插件配置 → Academic Research Skills** 关闭开关。工作台、技能和命令隐藏，配置保留。
卸载后重启 DSH：

```bash
dsh plugin --profile web remove dsh-academic-research-skills
```

遇到入口不显示、旧版缓存或远程部署问题，见 [安装排错](docs/INSTALL.zh-CN.md)。

## 当前能力边界

- 自动盘点仅使用 DSH 文件索引的候选路径，最多保留 2,000 项；引导提示最多列出 60 项，不保证穷尽所有文件。可限定子目录并手动纠正归类。
- 直接启动的任务保留最近 20 项，状态随打开的会话观察。新增路径只是候选产物，不检测原文件内容变化，不证明由某个任务产生。
- 场景、步骤与项目记忆按工作区路径保存在 DSH 设置中。跨电脑请通过“更多工具 → 导出 / 导入项目记忆”迁移 JSON；不包含论文正文、会话任务历史或审稿闭环。审稿闭环单独导出只供备份查看，不导入执行许可。
- 全文读取、联网检索与生成质量依赖宿主模型和工具。请勿上传无权共享的审稿意见、敏感数据或受限全文；按机构及刊会规范处理隐私与 AI 使用披露。
- 上游部分核验脚本与 Claude Code hooks 未移植；多角色技能描述不代表宿主一定并行启动多个代理。

## 开发与验证

仅二次开发者需要：

```bash
git clone https://github.com/masskx/dsh-research-loom.git
cd dsh-research-loom
npm install -g pnpm@10
pnpm install --frozen-lockfile
pnpm run verify
pnpm run install:local -- --profile web
dsh web
```

提交时包含 `lib/client.js` 和 `lib/client.js.map`，保证普通用户无需编译。开发安装使用带内容指纹的 tarball。
[验证说明](docs/QA.zh-CN.md)包含不调用模型的浏览器验收；测试通过不代表真实检索或学术评审质量已被系统测量。
反馈请到 [Issues](https://github.com/masskx/dsh-research-loom/issues)，附版本和脱敏后的复现步骤。

## 来源与许可

基于 [nullptr-DZF/dsh-academic-research-skills](https://github.com/nullptr-DZF/dsh-academic-research-skills)
二次开发；学术技能衍生自 Cheng-I Wu（[Imbad0202](https://github.com/Imbad0202)）的
[Academic Research Skills](https://github.com/Imbad0202/academic-research-skills) v3.21.1。
保留 4 个核心技能和 16 个 `/ars-*` 命令，并增加交互工作台、材料归类、任务回流、项目记忆与新手引导。

继续遵循 **CC-BY-NC-4.0**，要求署名且仅限非商业用途；这是公开源码项目，不属于 OSI 定义的开源许可。
见 [NOTICE](NOTICE.md) 和 [LICENSE](LICENSE)。

## English

Research Loom is a research workbench for **an existing DeepSeek Harness installation** (tested with DSH 0.1.1-rc.2).
Stop the running Web server, install, then restart:

```bash
dsh plugin --profile web add github:masskx/dsh-research-loom
dsh web
```

No clone or build is needed. Select a paper workspace, configure a working model and open **Paper workbench**.
The **Start** tab offers **I have a manuscript**, **Start from scratch**, and **Revise after peer review**.
Each has three steps with required inputs and expected outputs. **Prepare task in chat** fills a draft only; review it and send in DSH.
Switching steps never confirms research completion. Materials and the full workflow remain available in separate tabs.

Document reading and web search require suitable host tools; credentials and costs belong to your DSH configuration.
Inventory is path-based, not an academic quality assessment. The internal package/settings names remain
`dsh-academic-research-skills` / **Academic Research Skills**. Licensed **CC-BY-NC-4.0**, non-commercial only.

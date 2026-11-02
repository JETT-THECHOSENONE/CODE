# 逐页视觉对比报告

日期：2026-11-02。工具：Playwright Chromium。对照视口：1440 × 900、390 × 844、375 × 812。

## 对照方法

原版与本地版均使用独立浏览器上下文，采用相同人数、30 秒回合和相同答案“苹果”。原版截图保存在 `docs/reference/`，本地结果保存在 `docs/screenshots/`。每轮修改后重新截图检查卡片位置、尺寸、文字层级、圆角、颜色、阴影和移动端溢出。

## 1. 首页——已真实对照

- 原版：`reference/original-home-1440.png`、`original-home-390.png`、`original-home-375.png`
- 本地：`screenshots/home-desktop.png`、`home-mobile-390.png`
- 修正：桌面内容宽度改为 1020px；右侧卡片校准为 439px；恢复珊瑚红标题第二行、爱心纹理、粉色标签栏、白色分段选中态、30 秒默认值和原版相近的移动端英雄区。
- 保留差异：品牌图形为独立绘制的简化心形，没有复制原站图标资产；规则/隐私入口仍保留本项目所需功能。

## 2. 加入房间——已真实对照

- 原版：`reference/original-flow/desktop-1440/02-guest-entry.png`
- 本地：邀请链接打开后使用同一首页卡片的加入状态。
- 修正：加入标签、邀请码输入、昵称输入、主按钮颜色和卡片宽度与创建页统一；邀请链接继续自动填入房间号。

## 3. 等待大厅——已真实对照

- 原版桌面：`reference/original-flow/desktop-1440/04-full-lobby.png`
- 原版手机：`reference/original-flow/mobile-390/04-full-lobby.png`
- 本地桌面：`screenshots/lobby-full-desktop.png`
- 本地手机：`screenshots/lobby-mobile-390.png`
- 修正：使用约 490px 居中卡片、粉色状态栏、编号玩家槽、状态胶囊、绿色邀请按钮和珊瑚色开始按钮；手机端房间号和语言按钮换到第二行。
- 行为校准：按原版改为满员后房主手动开始；普通玩家看到等待房主状态。

## 4. 同词回合输入——已真实对照

- 原版桌面：`reference/original-flow/desktop-1440/05-round-input.png`
- 原版手机：`reference/original-flow/mobile-390/05-round-input.png`
- 本地桌面：`screenshots/round-input.png`
- 本地手机：`screenshots/round-input-mobile-390.png`
- 修正：顶部轮次/倒计时状态栏、居中提示、60/68px 输入框、全宽“锁定答案”按钮和底部玩家提交面板均按截图重排。390px 页面卡片顶部和底部位置已与原版接近，无横向溢出。

## 5. 等待与揭晓——部分对照

- 本地：`screenshots/reveal.png`
- 原版提交后只稳定捕获到短暂“加载中…”和随后的成功结算，未取得可重复停留的独立揭晓卡片。
- 处理：保留现有同步翻牌/淡入揭晓动画和服务端 2.6 秒状态，不宣称该动画与原版完全一致。

## 6. 同词成功结算——已真实对照

- 原版桌面：`reference/original-flow/desktop-1440/07-later-state.png`
- 原版手机：`reference/original-flow/mobile-390/07-later-state.png`
- 本地桌面：`screenshots/finish.png`
- 本地手机：`screenshots/finish-mobile-390.png`
- 修正：移除原先偏离原版的大号奖杯和独立结果块；改为顶部结果栏、玩家对阵条、逐轮双色答案、居中“再来一局”和底部链接。PNG 分享功能作为本项目需求保留为次级链接。

## 7. 默契问答——仅首页入口已对照

原版首页的模式选择入口已核实；完整配置、答题、揭晓和结算没有取得可用原版截图。本项目保留现有合理设计，没有将其标注为 100% 还原。

## 8. 三人、四人及异常状态——待核实

原版三/四人大厅、房满、超时、断线、重连和房主退出页面没有取得参考截图。本项目沿用已验证的两人设计语言和现有功能组件，不对这些页面做无依据的大幅改造。

## 回归结果

- `pnpm build`：通过。
- Socket.IO/Vitest：3 项通过，覆盖两人、四人容量与五题双语问答。
- Playwright：4 项通过，覆盖首轮成功、多轮成功、刷新恢复和 390px 无横向溢出。
- 视觉修改未改变答案保密、服务器计时、轮次校验和重连协议。

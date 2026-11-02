# 同词相遇 · SAME WORD

独立实现的在线多人联想与默契问答小游戏。项目参考了公开可见的《同词相遇》首页交互与设计语言，但不冒充官方、不包含原站专有素材或题库。

## 已实现

- 2 / 3 / 4 人六位房间号与邀请链接
- Socket.IO 服务端权威状态机、服务器截止时间、答案揭晓前保密
- 同词联想：任意多轮、严格同词判定、完整历史、结算与 PNG 分享卡
- 默契问答：生活 / 脑洞 / 性格，5 / 10 / 15 题，稳定选项 ID 和中英双语
- 房主、离开与转移、断线状态、刷新重连与身份恢复、无活动房间清理
- 中英文界面、IME 安全提交、桌面和移动端响应式、减少动效偏好
- 非原生 alert 的错误、规则和隐私交互

当前原创题库为 45 题（每类 15 题），没有用重复题凑到 1,000 题。扩充时保持 `server/src/questions.ts` 中稳定 ID、双语语义和 A/B/C 选项结构即可。

## 本地启动

要求 Node.js 24+、pnpm 11+。

```bash
pnpm install
pnpm dev
```

浏览器访问 `http://localhost:5173`。后端健康检查：`http://localhost:3001/health`。

生产构建与运行：

```bash
pnpm build
pnpm start
```

构建后的服务器会自动托管 `client/dist`；默认访问 `http://localhost:3001`。

## 测试

```bash
pnpm --filter @same-word/server test
pnpm test:e2e
```

端到端测试会启动本地前后端，使用多个独立 Chromium 上下文模拟真实玩家。测试报告在 `playwright-report/`。

## Docker 与公开部署

```bash
docker compose up --build
```

访问 `http://localhost:3001`。公开部署请选择支持 WebSocket 长连接的 Node/Docker 平台，如 Render、Railway、Fly.io 或自有服务器；仓库包含 `render.yaml`。生产时把 `CLIENT_ORIGIN` 设置成实际 HTTPS 域名。若前后端分域部署，还需把前端 `VITE_SERVER_URL` 设置为后端 HTTPS 地址再构建。

当前房间状态保存在单进程内存中，适合单实例或粘性会话部署。多实例生产环境应把房间/会话迁移到 Redis，并使用 Socket.IO Redis Adapter。`server/prisma/schema.prisma` 已预留完成局记录模型；实时房间不应依赖 SQLite 跨实例同步。

## 目录

- `client/` React + TypeScript + Vite + Zustand + Framer Motion
- `server/` Express + Socket.IO 服务端状态机
- `shared/` 共享事件、快照与数据类型
- `tests/e2e/` 多浏览器 Playwright 测试
- `docs/` 原版调研、假设、规格、截图和测试报告

## 规则说明

同词比较使用 Unicode NFC、去首尾空白后严格比较；大小写和内部空格不自动归一。超时未答记为 `null`，不可能匹配成功。默契率为“全员选择同一选项的题数 / 总题数 × 100%”，仅作游戏娱乐评价。

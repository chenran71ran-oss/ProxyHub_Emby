# Fork 维护记录

## 2026-10-25 · 初始化

- 从 MakkaPakka518/ProxyHub_Emby Fork，保留作者提交历史和来源。
- 建立 upstream 原版跟踪分支和 chore/repository-maintenance 维护分支。
- main 继续作为默认分支；维护通过 PR 合入。
- 添加贡献规范、PR 模板、上游基线记录、同步及回滚说明。
- 计划在 feat/dashboard-ui 独立适配旧版个人 UI；本轮未迁移 UI、未修改 worker.js、未部署线上环境。
- 本记录不表示运行时测试或 UI 验收已通过。


## 2026-10-25 · 4.0.4 Dashboard UI v03

- 在 feat/dashboard-ui 适配灰紫浅色、灰阶深色和蓝色控件，保留 4.0.4 的页面结构及事件。
- UI 源码独立存于 ui/，固定原版存于 .upstream/，增加 build.mjs 和 test.mjs。
- 面板更新源切换到个人 Fork main，原版候选会触发兼容提示；不声称自动合并上游。
- 完成脚本语法、原始 DOM 保留、无真实 D1 的响应对比及桌面/390/320 预览交互检查。
- 线上部署、真实 D1 迁移和实际播放结果需要单独验收，不因本条记录或 PR 合并自动视为通过。

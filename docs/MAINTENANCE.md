# 上游同步、发布与回滚

## 初始化状态（2026-10-25，Asia/Shanghai）

- Fork：`chenran71ran-oss/ProxyHub_Emby`，默认分支 `main`。
- 上游：`MakkaPakka518/ProxyHub_Emby:main`。
- 初始基线：`5308d6c6e332d423475280f819d82bef04b55fab`。
- 当时 changelog.json 顶部版本为 **4.0.4**；README 徽章仍为 4.0.2，因此不以徽章单独认定版本。未独立验证混淆 Worker 中的版本或运行时行为。
- main 中 Worker 与 Fork 时上游相同；旧 3.1.2 Dashboard UI 尚未移植。已有工作流是上游手动发版，不是自动部署。
- 本轮仅建立仓库维护基础；未启用定时同步、自动合并、CI 或生产部署。

## 同步流程

上游 main → 本仓库 upstream（原版） → sync/*（合并和适配） → PR → main → 明确授权后的部署。

```bash
git clone https://github.com/chenran71ran-oss/ProxyHub_Emby.git
cd ProxyHub_Emby
git remote add upstream https://github.com/MakkaPakka518/ProxyHub_Emby.git
git fetch origin
git fetch upstream
git switch upstream
git merge --ff-only upstream/main
git push origin upstream
```

如果快进失败，先检查 upstream 是否混入个人提交；停止并调查，不 force push。

从 main 创建本次同步分支（版本和日期仅为示例，按实际更新命名）：

```bash
git switch main
git pull --ff-only origin main
git switch -c sync/upstream-4.0.4-20261025
git merge --no-ff origin/upstream
```

有冲突就逐项检查。不要全量选择 theirs/ours；即便 Git 报告无冲突，也必须检查页面结构、接口、权限和 UI。同步 PR 使用 **Create a merge commit**，保留作者提交祖先。

## 上线前检查

- 固定上游 commit，记录实际 Worker 版本和 Fork UI 修订，分别维护。
- Worker 语法检查可在支持 Node.js 的本地环境执行：`node --input-type=module --check < worker.js`。这仅解析语法，不执行脚本，也不证明内嵌脚本和反代正常。
- 另外提取并检查内嵌页面脚本，避免模板字符串转义问题。
- 桌面、390px、320px 的明暗主题、主题记忆、登录、节点编辑、搜索和弹窗验收。
- 测试 Worker / 测试 D1 验证接口；真实反代和流式传输需单独验证。
- 上游包含混淆代码时不能仅凭差异小就声称完成后端安全审计。
- 未完成的检查写入 PR，禁止编造测试结论。

## 更新源与发布

旧版面板的更新链接仍可能指向作者原版。Fork 本身不会改变线上更新行为。自定义 UI 适配完成后，需在独立 PR 中审查、调整更新源及兼容保护；在此之前不要把作者代码直接覆盖到个人 UI 部署。

现有 `.github/workflows/release.yml` 从上游继承，仅可手动发版；初始化未运行该流程。个人版本策略确定前不使用其直接发布个人构建，以免把上游版本号误当个人 UI 版本。

后续建议：上游版本 `4.0.4` 与个人 UI 修订 `ui.1` 分开记录，正式发布可采用 `v4.0.4-ui.1`；实际适配和验收完成前不创建该标签或宣称已发布。

## 回滚

1. 发布前记录当前线上版本、Git commit、绑定与配置，并备份 D1。不要把敏感备份提交到公开仓库。
2. 代码回滚优先通过 PR 使用 `git revert`；合并提交用 `git revert -m 1 <merge-sha>`，逐项检查反向改动。
3. 经明确授权后部署之前已验证的 commit/Cloudflare 版本。不要强推 main 来假装回滚。
4. 代码回退不等于数据库回退；有 D1 迁移时必须单独确认兼容性。Git 不能恢复未备份的线上数据。

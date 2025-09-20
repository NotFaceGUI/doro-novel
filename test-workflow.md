# GitHub Actions 工作流测试指南

## 测试方法

由于你还没有推送到远程仓库，以下是几种测试工作流的方法：

### 方法1：本地构建测试（推荐）

在推送到远程仓库之前，可以先在本地测试 Tauri 构建过程：

```bash
# 安装依赖
pnpm install

# 测试开发构建
pnpm tauri dev

# 测试生产构建
pnpm tauri build
```

### 方法2：使用 act 工具本地运行 GitHub Actions

1. 安装 act 工具：
```bash
# Windows (使用 Chocolatey)
choco install act-cli

# 或者下载二进制文件
# https://github.com/nektos/act/releases
```

2. 在项目根目录运行：
```bash
# 测试 push 事件触发的工作流
act push

# 测试特定工作流
act -W .github/workflows/test-build.yml
```

### 方法3：创建测试分支推送

1. 创建一个测试分支：
```bash
git checkout -b test-workflow
git add .
git commit -m "test: add github workflows"
git push origin test-workflow
```

2. 在 GitHub 上创建 Pull Request 到 main 分支，这会触发 `test-build.yml` 工作流

### 方法4：推送标签触发发布

当你准备好发布时：

```bash
# 创建并推送标签
git tag v0.1.0
git push origin v0.1.0
```

这会触发 `publish.yml` 工作流，自动构建并创建 GitHub Release。

## 工作流触发条件说明

### publish.yml
- **推送标签**：`git push origin v1.0.0` （推荐用于正式发布）
- **推送到 main/release 分支**：直接推送代码

### test-build.yml  
- **Pull Request**：创建 PR 到 main/release 分支
- **推送到 develop 分支**：推送到开发分支

### manual-release.yml
- **手动触发**：在 GitHub Actions 页面手动运行

## 注意事项

1. **首次推送**：建议先推送到测试分支，确认工作流正常运行
2. **权限设置**：确保仓库有 Actions 权限和 Release 写入权限
3. **密钥配置**：GITHUB_TOKEN 会自动提供，无需额外配置
4. **构建时间**：多平台构建可能需要 10-30 分钟

## 推荐测试流程

1. 先在本地运行 `pnpm tauri build` 确保构建成功
2. 推送到测试分支，观察 test-build 工作流
3. 确认无误后，推送到 main 分支或创建标签进行发布
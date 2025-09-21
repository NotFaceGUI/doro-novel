# 贡献指南

感谢您有兴趣为 Doro Novel 做出贡献！本文档提供了指南和说明，可帮助您设置开发环境并开始贡献。

## 快速开始

### 环境要求

在开始为项目做出贡献之前，您需要设置开发环境。以下是您需要遵循的步骤：

#### 先决条件

- **Node.js 18+** - JavaScript 运行时环境
- **pnpm 8+** - 高效的包管理器
- **Rust 1.70+** - 系统编程语言
- **Tauri CLI 2.0+** - 桌面应用构建工具

#### Windows 用户设置

如果您是 Windows 用户，则可能需要执行一些其他步骤：

1. 确保将 Rust 和 Node.js 添加到系统的 PATH 中
2. 安装 Visual Studio Build Tools 或 Visual Studio Community
3. 设置 Rust 工具链：

```bash
rustup target add x86_64-pc-windows-msvc
rustup set default-host x86_64-pc-windows-msvc
```

#### 安装 Node.js 包管理器

```bash
npm install pnpm -g
```

### 安装依赖

#### 安装项目依赖

```bash
pnpm install
```

#### Linux 用户额外依赖 (Ubuntu/Debian)

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf
```

### 开发模式

启动开发服务器：

```bash
pnpm tauri dev
```

如果应用实例已存在，使用不同的命令：

```bash
pnpm dev:diff
```

### 构建项目

#### 标准构建

```bash
pnpm tauri build
```

#### 快速构建

为了加快开发过程中的构建速度：

```bash
pnpm build:fast
```

这使用 Rust 的快速发布配置文件，通过禁用优化显著减少编译时间。生成的二进制文件将比标准构建更大且性能更差，但对于快速测试更改很有用。

#### 清理构建

清除构建缓存：

```bash
pnpm clean
```

## 开发环境设置

### 补丁系统

项目使用 `patch-package` 来修复第三方依赖的问题：

```bash
# 应用补丁
pnpm install

# 创建新补丁
pnpm patch <package-name>
# 修改文件后提交
pnpm patch-commit <patch-folder>
```

### 构建配置

- 使用 pnpm workspace 管理依赖
- 支持增量构建和热重载
- 自动化 CI/CD 流程

## 代码质量

### 提交更改之前

如果您更改了 Rust 代码，建议执行代码样式格式和质量检查。

#### 代码质量检查

```bash
# Rust 后端代码检查
cd src-tauri
cargo clippy

# 前端代码检查
pnpm lint
```

#### 代码样式格式

```bash
# Rust 后端格式化
cd src-tauri
cargo fmt

# 前端格式化检查和修复
pnpm format:check
pnpm format
```

### TypeScript 类型检查

```bash
pnpm type-check
```

## 贡献流程

### 完成更改后

1. **Fork 存储库** - 在 GitHub 上 fork 本项目
2. **创建功能分支** - 为功能或 bug 修复创建新分支
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **提交更改** - 使用清晰简洁的提交消息
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **推送分支** - 将分支推送到您的 fork
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **创建 Pull Request** - 向我们的存储库提交拉取请求

### 提交消息规范

请使用清晰的提交消息格式：

```
类型(范围): 简短描述

详细描述（可选）

相关 issue（可选）
```

类型包括：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### Pull Request 指南

- 确保您的代码通过所有测试
- 更新相关文档
- 保持 PR 范围小且专注
- 提供清晰的 PR 描述
- 链接相关的 issue

## 项目结构

了解项目结构有助于您更好地贡献：

```
doro-novel/
├── src/                    # Vue 前端源码
│   ├── components/         # Vue 组件
│   ├── views/             # 页面视图
│   ├── script/            # 核心逻辑
│   ├── stores/            # Pinia 状态管理
│   └── types/             # TypeScript 类型定义
├── src-tauri/             # Tauri 后端源码
│   ├── src/               # Rust 源码
│   └── resources/         # 应用资源
├── patches/               # 依赖补丁
└── util/                  # 构建工具
```

## 获得帮助

如果您在贡献过程中遇到问题：

1. 查看现有的 [Issues](https://github.com/NotFaceGUI/doro-novel/issues)
2. 创建新的 Issue 描述您的问题
3. 在 Pull Request 中提及相关维护者

我们感谢您的贡献，并期待您积极参与我们的项目！
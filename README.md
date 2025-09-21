<h1 align="center">
  <img src="./src-tauri/icons/icon.png" alt="Doro Novel" width="128" />
  <br>
  Doro Novel
  <br>

</h1>

<h3 align="center">
  <p align="center">
    <small align="center">
      简体中文 | 
      <a href="./docs/en-US/README.md">English</a> | 
      <a href="./docs/ja-JP/README.md">日本語</a> | 
      <a href="./docs/ko-KR/README.md">한국어</a>
    </small>
  </p>
🎨 A visual novel editor built with <a href="https://github.com/tauri-apps/tauri">Tauri</a>, designed for creating Nikke-style interactive visual novels, supporting visual editing, branching storylines, multi-language localization, and real-time preview.
</h3>

## 预览

![Doro Novel Preview](./docs/image/preview-default.png)

<p align="center">
  <a href="https://github.com/NotFaceGUI/doro-novel/releases/latest">
    <strong>下载最新版本</strong>
  </a>
</p>

## 使用指南

### 📦 下载与安装

1. **下载应用程序**
   - 访问 [Releases 页面](https://github.com/NotFaceGUI/doro-novel/releases/latest)
   - 根据您的操作系统下载对应版本：
     - Windows: `doro-novel_x.x.x_x64-setup.exe`
     - macOS: `doro-novel_x.x.x_x64.dmg`
     - Linux: `doro-novel_x.x.x_amd64.AppImage`

2. **安装应用程序**
   - Windows: 双击 `.exe` 文件，按照安装向导完成安装
   - macOS: 打开 `.dmg` 文件，将应用拖拽到 Applications 文件夹
   - Linux: 给 `.AppImage` 文件添加执行权限后直接运行

### 🎮 开始使用

1. **启动应用程序**
   - 首次启动会显示欢迎界面和使用指南

2. **文件关联**
   - 应用程序支持 `.doro`、`.Doro`、`.DORO` 格式的项目文件
   - 安装后可以直接双击这些文件打开项目

3. **资源管理**
   
   应用程序的资源文件位于 `resources` 文件夹下，包含以下目录：
   
   - **📁 audio** - 音频资源文件夹
     - 存放背景音乐、音效等音频文件
   
   - **📁 character** - 角色资源文件夹
     - 包含不同角色的Spine文件（详细教程）
   
   - **📁 image** - 图像资源文件夹
     - 存放背景图片，立绘等
     - `Background` 子文件夹存放背景图片
     - `x2` 子文件夹存放高分辨率资源
   
   - **📁 locales** - 多语言文件夹
     - 支持中文 `zh-CN`、英文 `en-US`、日文 `ja-JP`、韩文 `ko-KR`
   
   - **📁 package** - 打包资源文件夹
     - 包含着色器等特殊资源文件
     - 或是一些json详细详细
   
   - **📁 video** - 视频资源文件夹
     - 存放动画视频文件
   
   - **📄 spine-character.json** - Spine 角色配置文件
     - 定义角色动画和骨骼信息

### 💡 使用技巧

- 支持拖拽导入资源文件
- 可以实时预览 Spine 动画效果
- 支持多语言界面切换
- 内置资源管理器便于文件组织（feature）



## 快速开始

> 先决条件

- 确保您的系统满足 [Tauri 要求](https://tauri.app/v1/guides/getting-started/prerequisites)
- 安装 [pnpm](https://pnpm.io/installation) 包管理器
- 想要开始使用或贡献代码？请查看我们的 [贡献指南](CONTRIBUTING.md) 获取详细的环境设置和开发说明。

```bash
git clone https://github.com/NotFaceGUI/doro-novel.git
cd doro-novel

pnpm install

pnpm postinstall

pnpm tauri dev `or` pnpm tauri build
```

## 贡献

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细的贡献指南。

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [PixiJS](https://pixijs.com/) - 2D 渲染引擎
- [Spine](http://esotericsoftware.com/) - 2D 骨骼动画工具

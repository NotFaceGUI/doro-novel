<h1 align="center">
  <img src="../../src-tauri/icons/icon.png" alt="Doro Novel" width="128" />
  <br>
  Doro Novel
  <br>
  <p align="center">
    <small align="center">
      <a href="../../README.md">简体中文</a> | 
      English | 
      <a href="../ja-JP/README.md">日本語</a> | 
      <a href="../ko-KR/README.md">한국어</a>
    </small>
  </p>
</h1>

<h3 align="center">
A visual novel editor based on <a href="https://github.com/tauri-apps/tauri">Tauri</a> , designed for creating interactive visual novels.
</h3>

## Preview

![Doro Novel Preview](../image/preview-default.png)

<p align="center">
  <a href="https://github.com/NotFaceGUI/doro-novel/releases/latest">
    <strong>Download Latest Version</strong>
  </a>
</p>

> ⚠️ This document was translated by AI.  
If you find any inappropriate or unnatural expressions, please feel free to point them out or adjust as needed.


## User Guide

### 📦 Download and Installation

1. **Download Application**
   - Visit the [Releases page](https://github.com/NotFaceGUI/doro-novel/releases/latest)
   - Download the version for your operating system:
     - Windows: `doro-novel_x.x.x_x64-setup.exe`
     - macOS: `doro-novel_x.x.x_x64.dmg`
     - Linux: `doro-novel_x.x.x_amd64.AppImage`

2. **Install Application**
   - Windows: Double-click the `.exe` file and follow the installation wizard
   - macOS: Open the `.dmg` file and drag the app to the Applications folder
   - Linux: Add execute permissions to the `.AppImage` file and run directly

### 🎮 Getting Started

1. **Launch Application**
   - A welcome screen and usage guide will be displayed on first launch

2. **File Association**
   - The application supports project files in `.doro`, `.Doro`, `.DORO` formats
   - After installation, you can double-click these files to open projects

3. **Resource Management**
   
   The application's resource files are located in the `resources` folder, which includes the following directories:
   
   - **📁 audio** - Audio resources folder
     - Stores audio files such as background music and sound effects
   
   - **📁 character** - Character resources folder
     - Spine Files Containing Different Characters (Detailed Tutorial)
   
   - **📁 image** - Image resource folder
     - Stores background images, character illustrations, etc.
     - `Background` subfolder stores background images
     - `x2` subfolder stores high-resolution resources
   
   - **📁 locales** - Localization folder
     - Supports Chinese `zh-CN`, English `en-US`, Japanese `ja-JP`, Korean `ko-KR`
   
   - **📁 package** - Packaging resource folder
     - Contains shaders and other special resources
     - Or some detailed JSON files
   
   - **📁 video** - Video resources folder
     - Stores animated video files
   
   - **📄 spine-character.json** - Spine character configuration file
     - Defines character animation and skeletal information

### 💡 Usage Tips

- Supports drag-and-drop import of resource files
- Real-time preview of Spine animation effects
- Supports multi-language interface switching
- Built-in resource manager for convenient file organization

## Quick Start

> Prerequisites

- Ensure your system meets [Tauri requirements](https://tauri.app/v1/guides/getting-started/prerequisites)
- Install [pnpm](https://pnpm.io/installation) package manager
- Want to get started or contribute to the code? Check out the [Contributing Guide](../../CONTRIBUTING.md) for detailed environment setup and development guidelines.

```bash
git clone https://github.com/NotFaceGUI/doro-novel.git
cd doro-novel

pnpm install
pnpm postinstall
pnpm tauri dev # or pnpm tauri build
```

## Contributing

All forms of contributions are welcome! Please check [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed contribution guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) - Cross-platform desktop application framework
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [PixiJS](https://pixijs.com/) - 2D rendering engine
- [Spine](http://esotericsoftware.com/) - 2D skeletal animation tool

<h3 align="center">
A visual novel editor based on <a href="https://github.com/tauri-apps/tauri">Tauri</a> + Vue 3 + TypeScript, designed for creating interactive visual novels.
</h3>

## Features

- 🎨 **Visual Editing** - Intuitive drag-and-drop interface design
- 🎭 **Spine Animation Support** - Complete 2D skeletal animation system
- 🌍 **Multi-language Support** - Supports Chinese, English, Japanese, Korean
- 📱 **Cross-platform** - Supports Windows, macOS, Linux
- 🎵 **Multimedia Integration** - Audio, video, and image resource management
- ⚡ **High Performance Rendering** - Smooth rendering experience based on PixiJS

## Tech Stack

- **Frontend Framework**: Vue 3 + TypeScript
- **Desktop Framework**: Tauri
- **Rendering Engine**: PixiJS
- **Animation System**: Spine Runtime
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Preview

![Doro Novel Preview](../image/preview-default.png)

<p align="center">
  <a href="https://github.com/NotFaceGUI/doro-novel/releases/latest">
    <strong>📥 Download Latest Version</strong>
  </a>
</p>

## User Guide

### 📦 Download & Installation

1. **Download Application**
   - Visit [Releases page](https://github.com/NotFaceGUI/doro-novel/releases/latest)
   - Download the version for your operating system:
     - Windows: `doro-novel_x.x.x_x64-setup.exe`
     - macOS: `doro-novel_x.x.x_x64.dmg`
     - Linux: `doro-novel_x.x.x_amd64.AppImage`

2. **Install Application**
   - Windows: Double-click the `.exe` file and follow the installation wizard
   - macOS: Open the `.dmg` file and drag the app to Applications folder
   - Linux: Add execute permission to the `.AppImage` file and run directly

### 🎮 Getting Started

1. **Launch Application**
   - Welcome screen and user guide will be displayed on first launch

2. **File Association**
   - The application supports `.doro`, `.Doro`, `.DORO` project file formats
   - You can directly double-click these files to open projects after installation

3. **Resource Management**
   
   Application resource files are located in the `resources` folder, containing the following directories:
   
   - **📁 audio** - Audio resource folder
     - Store background music, sound effects and other audio files
   
   - **📁 character** - Character resource folder
     - Store character portraits, expressions and other image resources
     - Contains subfolders for different characters (e.g., c010, c510, etc.)
   
   - **📁 image** - Image resource folder
     - Store background images, UI elements, etc.
     - `Background` subfolder stores background images
     - `x2` subfolder stores high-resolution resources
   
   - **📁 locales** - Multi-language folder
     - Supports Chinese (zh-CN), English (en-US), Japanese (ja-JP), Korean (ko-KR)
   
   - **📁 package** - Package resource folder
     - Contains shaders and other special resource files
   
   - **📁 video** - Video resource folder
     - Store animation video files
   
   - **📄 spine-character.json** - Spine character configuration file
     - Defines character animations and skeletal information

### 💡 Usage Tips

- Support drag-and-drop import of resource files
- Real-time preview of Spine animation effects
- Support multi-language interface switching
- Built-in resource manager for easy file organization

## Quick Start

> Prerequisites

- Ensure your system meets [Tauri requirements](https://tauri.app/v1/guides/getting-started/prerequisites)
- Install [pnpm](https://pnpm.io/installation) package manager
- Want to get started or contribute code? Check our [Contributing Guide](../../CONTRIBUTING.md) for detailed environment setup and development instructions.

```bash
git clone https://github.com/NotFaceGUI/doro-novel.git
cd doro-novel

pnpm install
pnpm postinstall
pnpm tauri dev # or pnpm tauri build
```

## Contributing

We welcome all forms of contributions! Please check [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed contribution guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) - Cross-platform desktop application framework
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [PixiJS](https://pixijs.com/) - 2D rendering engine
- [Spine](http://esotericsoftware.com/) - 2D skeletal animation tool
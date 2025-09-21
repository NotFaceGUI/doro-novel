<h1 align="center">
  <img src="../../src-tauri/icons/icon.png" alt="Doro Novel" width="128" />
  <br>
  Doro Novel
  <br>

</h1>

<h3 align="center">
  <p align="center">
    <small align="center">
      <a href="../../README.md">简体中文</a> | 
      English | 
      <a href="../ja-JP/README.md">日本語</a> | 
      <a href="../ko-KR/README.md">한국어</a>
    </small>
  </p>
🎨 A visual novel editor built with <a href="https://github.com/tauri-apps/tauri">Tauri</a>, designed for creating Nikke-style interactive visual novels, supporting visual editing, branching storylines, multi-language localization, and real-time preview.
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
     - Contains Spine files for different characters

     ---
     
     ### 🚀 Automatic Character Resource Update Scripts
     
     To facilitate obtaining the latest character resources, we provide cross-platform automatic update scripts:
     
     #### Windows Users
     ```powershell
     # Execute in the application installation directory
     .\update_l2d.ps1
     ```
     
     #### Mac Users
     ```bash
     # Execute in the application installation directory
     ./update_l2d_mac.sh
     ```
     
     #### Linux Users
     ```bash
     # Execute in the application installation directory
     ./update_l2d_linux.sh
     ```
     
     #### Script Functionality
     
     These scripts will automatically perform the following operations:
     
     1. **Check Git Environment**
        - Windows: Automatically download and extract MinGit portable version (approximately 45MB)
        - Mac/Linux: Check system Git installation and provide installation guidance
     
     2. **Clone/Update Resource Repository**
        - Clone the latest L2D resources from [Nikke-db/Nikke-db.github.io](https://github.com/Nikke-db/Nikke-db.github.io)
        - If already exists, execute `git pull` to update to the latest version
     
     3. **Smart File Synchronization**
        - Compare the source repository's `l2d` directory with the local `resources/character` directory
        - Only copy missing files to avoid duplicate downloads
        - Maintain complete directory structure
     
     4. **Download Content**
        - Spine animation files for various characters (.skel, .atlas, .png)
        - Character illustrations and expression resources
        - Estimated total size: 3GB+ (depending on the number of characters)
     
     #### 🙏 Acknowledgments
     
     Special thanks to the [Nikke-db](https://github.com/Nikke-db) team for maintaining the open-source resource repository [Nikke-db.github.io](https://github.com/Nikke-db/Nikke-db.github.io), providing complete character resource data for the community. This repository contains high-quality Spine animation resources for all characters in the game, enabling this project to provide rich character display functionality for users.
     
     Without their selfless contribution and continuous maintenance, the character system of this project would not be able to achieve such complete functionality.

     ---
   
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

## Disclaimer

> **⚠️ Important Notice: Please read the following terms carefully**

### Purpose of Use
- This software is **for educational, research, and technical communication purposes only**
- **Commercial use or profit-making activities are strictly prohibited**
- Aims to promote technical development and knowledge sharing in the open source community

### Resource Sources
- All resources are from **publicly accessible channels**
- This software **does not contain or distribute any form of game unpacking content**
- Users need to **obtain resource files on their own**

### Legal Responsibility
- Users **must comply with local laws and regulations** when using this software
- **Users are solely responsible** for any legal issues arising from the use of this software
- Developers are not liable for any legal consequences of user actions

### Intellectual Property
- Please respect the **copyright and intellectual property** of original works
- If third-party content is involved, ensure you have **obtained legal authorization**
- This project follows open source licenses, but this does not mean that referenced third-party resources are also open source

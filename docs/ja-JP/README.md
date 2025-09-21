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
      <a href="../en-US/README.md">English</a> | 
      日本語 | 
      <a href="../ko-KR/README.md">한국어</a>
    </small>
  </p>
🎨 <a href="https://github.com/tauri-apps/tauri">Tauri</a> を基盤にしたビジュアルノベルエディタで、Nikke風のインタラクティブビジュアルノベル を制作するために設計されています。ビジュアル編集、分岐シナリオ、多言語ローカライズ、リアルタイムプレビューをサポート。
</h3>

## プレビュー

![Doro Novel Preview](../image/preview-default.png)

<p align="center">
  <a href="https://github.com/NotFaceGUI/doro-novel/releases/latest">
    <strong>最新版をダウンロード</strong>
  </a>
</p>

> ⚠️ 本文書の内容はAIによって翻訳されたものです。  
不自然または不適切な表現がある場合は、ご指摘いただくか、ご自身で修正してください。

## 使用ガイド

### 📦 ダウンロードとインストール

1. **アプリケーションのダウンロード**
   - [リリースページ](https://github.com/NotFaceGUI/doro-novel/releases/latest)にアクセス
   - お使いのオペレーティングシステムに対応するバージョンをダウンロード：
     - Windows: `doro-novel_x.x.x_x64-setup.exe`
     - macOS: `doro-novel_x.x.x_x64.dmg`
     - Linux: `doro-novel_x.x.x_amd64.AppImage`

2. **アプリケーションのインストール**
   - Windows: `.exe`ファイルをダブルクリックし、インストールウィザードに従ってインストール
   - macOS: `.dmg`ファイルを開き、アプリをApplicationsフォルダにドラッグ
   - Linux: `.AppImage`ファイルに実行権限を追加して直接実行

### 🎮 使い始める

1. **アプリケーションの起動**
   - 初回起動時にウェルカム画面と使用ガイドが表示されます

2. **ファイル関連付け**
   - アプリケーションは`.doro`、`.Doro`、`.DORO`形式のプロジェクトファイルをサポート
   - インストール後、これらのファイルをダブルクリックしてプロジェクトを開くことができます

3. **リソース管理**
   
   アプリケーションのリソースファイルは`resources`フォルダ内にあり、以下のディレクトリが含まれます：
   
   - **📁 audio** - オーディオリソースフォルダ
     - 背景音楽、効果音などのオーディオファイルを保存
   
   - **📁 character** - キャラクターリソースフォルダ
     - さまざまなキャラクターを含むSpineファイル（詳細チュートリアル）
   
   - **📁 image** - 画像リソースフォルダ
     - 背景画像や立ち絵などを保存
     - `Background` サブフォルダには背景画像を保存
     - `x2` サブフォルダには高解像度リソースを保存
   
   - **📁 locales** - 多言語フォルダ
     - 中国語 `zh-CN`、英語 `en-US`、日本語 `ja-JP`、韓国語 `ko-KR` をサポート
   
   - **📁 package** - パッケージリソースフォルダ
     - シェーダーなどの特殊リソースを含む
     - あるいは詳細な JSON ファイル

   - **📁 video** - ビデオリソースフォルダ
     - アニメーションビデオファイルを保存
   
   - **📄 spine-character.json** - Spineキャラクター設定ファイル
     - キャラクターアニメーションとスケルタル情報を定義

### 💡 使用のコツ

- リソースファイルのドラッグ＆ドロップインポートをサポート
- Spineアニメーション効果のリアルタイムプレビューが可能
- 多言語インターフェース切り替えをサポート
- ファイル整理に便利な内蔵リソースマネージャー

## クイックスタート

> 前提条件

- システムが[Tauri要件](https://tauri.app/v1/guides/getting-started/prerequisites)を満たしていることを確認
- [pnpm](https://pnpm.io/installation)パッケージマネージャーをインストール
- 使い始めたい、またはコードに貢献したい場合は、詳細な環境設定と開発手順について[貢献ガイド](../../CONTRIBUTING.md)をご確認ください。

```bash
git clone https://github.com/NotFaceGUI/doro-novel.git
cd doro-novel

pnpm install
pnpm postinstall
pnpm tauri dev # または pnpm tauri build
```

## 貢献

あらゆる形の貢献を歓迎します！詳細な貢献ガイドラインについては[CONTRIBUTING.md](../../CONTRIBUTING.md)をご確認ください。

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています - 詳細については[LICENSE](../../LICENSE)ファイルをご覧ください。

## 謝辞

- [Tauri](https://tauri.app/) - クロスプラットフォームデスクトップアプリケーションフレームワーク
- [Vue.js](https://vuejs.org/) - プログレッシブJavaScriptフレームワーク
- [PixiJS](https://pixijs.com/) - 2Dレンダリングエンジン
- [Spine](http://esotericsoftware.com/) - 2Dスケルタルアニメーションツール
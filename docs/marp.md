# Marp スライド作成スキル

ユーザーから「Marpスライドを作って」「プレゼンを作成して」「スライドを作って」と依頼されたとき、またはMarpスライドの作成・編集を求められたときに使用するスキル。

## 実行手順

1. ユーザーの要件（テーマ・内容・スライド枚数・出力形式など）を確認する
2. 以下のテンプレートとガイドラインに従ってMarpファイルを作成する
3. ファイルを `.md` 形式で保存する
4. 必要に応じて変換コマンドを案内する

---

## 基本構造

```markdown
---
marp: true
theme: default
paginate: true
size: 16:9
---

# タイトル

内容

---

# 次のスライド
```

**フロントマター必須項目：** `marp: true`

---

## ビジネス提案スライドテンプレート（デフォルト）

特に指示がない場合、このテンプレートを使用する。

```markdown
---
marp: true
theme: default
paginate: true
header: 'プレゼンタイトル'

style: |
  /* ===== ベース ===== */
  section {
    font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
    font-size: 22px;
    padding: 48px 60px;
    color: #2d3748;
  }

  /* ===== 見出し ===== */
  h1 {
    font-size: 40px;
    color: #1a365d;
    border-bottom: 3px solid #3182ce;
    padding-bottom: 12px;
  }
  h2 {
    font-size: 30px;
    color: #2b6cb0;
    border-left: 5px solid #3182ce;
    padding-left: 14px;
    margin-top: 0;
  }
  h3 {
    font-size: 22px;
    color: #2c5282;
  }

  /* ===== テーブル ===== */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 19px;
  }
  th {
    background-color: #ebf4ff;
    color: #1a365d;
    padding: 8px 12px;
    border: 1px solid #bee3f8;
    text-align: left;
  }
  td {
    padding: 7px 12px;
    border: 1px solid #e2e8f0;
  }
  tr:nth-child(even) td {
    background-color: #f7fafc;
  }

  /* ===== ボックスコンポーネント ===== */
  .highlight-box {
    background: #ebf4ff;
    border-left: 4px solid #3182ce;
    padding: 12px 16px;
    border-radius: 4px;
    margin-top: 12px;
  }
  .warn-box {
    background: #fffff0;
    border-left: 4px solid #d69e2e;
    padding: 12px 16px;
    border-radius: 4px;
    margin-top: 12px;
  }
  .important-box {
    background: #fff5f5;
    border-left: 4px solid #e53e3e;
    padding: 12px 16px;
    border-radius: 4px;
    margin-top: 12px;
  }
  .success-box {
    background: #f0fff4;
    border-left: 4px solid #38a169;
    padding: 12px 16px;
    border-radius: 4px;
    margin-top: 12px;
  }
  .step-box {
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 18px;
    margin: 8px 0;
  }

  /* ===== ヘッダー・フッター ===== */
  header {
    font-size: 14px;
    color: #718096;
  }
  footer {
    font-size: 14px;
    color: #718096;
  }

  /* ===== タイトルスライド ===== */
  section.title-slide {
    background: linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  section.title-slide h1 {
    color: white;
    border-bottom: 3px solid rgba(255,255,255,0.4);
    font-size: 44px;
  }
  section.title-slide p {
    color: rgba(255,255,255,0.85);
    font-size: 22px;
  }

  /* ===== セクション区切りスライド ===== */
  section.section-divider {
    background: #ebf4ff;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  section.section-divider h1 {
    font-size: 46px;
    color: #1a365d;
  }

  /* ===== スクリーンショット全面スライド ===== */
  section.screenshot-slide {
    padding: 0;
    background: #1a202c;
  }
---
```

---

## スライド種別の使い方

### タイトルスライド（1枚目）

```markdown
<!-- _class: title-slide -->
<!-- _header: '' -->
<!-- _paginate: false -->

# プレゼンタイトル

サブタイトル・キャッチコピー

**2026年○月　○○株式会社**
```

### セクション区切りスライド

```markdown
<!-- _class: section-divider -->

# 1. セクション名
```

### 通常コンテンツスライド

```markdown
## スライドタイトル

- 箇条書き項目1
- 箇条書き項目2
- 箇条書き項目3
```

### スクリーンショット全面スライド

```markdown
<!-- _class: screenshot-slide -->

![bg contain](./images/screenshot.png)
```

---

## ボックスコンポーネント

| クラス名 | 色 | 用途 |
|---|---|---|
| `highlight-box` | 青 | ポイント・まとめ・補足情報 |
| `warn-box` | 黄 | 注意事項・制限・留意点 |
| `important-box` | 赤 | 失敗例・重要な警告 |
| `success-box` | 緑 | 成功例・推奨アプローチ |
| `step-box` | グレー | 手順・フェーズ・ステップ |

使用例：

```markdown
<div class="highlight-box">

**ポイント：** ここに強調したい内容を書く

</div>

<div class="warn-box">

**注意：** ここに注意事項を書く

</div>

<div class="success-box">

**推奨：** ここに推奨内容を書く

</div>

<div class="step-box">
<strong>ステップ1：</strong>ここに手順を書く
</div>
```

---

## SVGインライン図表

> **ルール：** フロー図・構成図・手順図など、図やダイアグラムが必要な場面では**アスキーアート（`→`・`─`・`┌`等）を使わず、必ずSVGインライン埋め込みで表現する**。SVGはPPTX・PDFでも確実に動作し、日本語混在でも崩れない。

**PPTX・PDFでも確実に動作**する図表方式。日本語混在でも崩れない。

### 前提設定（フロントマターに追加）

```yaml
html: true
```

CLIで変換する場合は `--html` フラグも必要：

```bash
npx @marp-team/marp-cli input.md --html --pptx -o output.pptx
```

毎回省略したい場合は `.marprc.yml` を作成：

```yaml
# .marprc.yml
html: true
```

### SVG基本構造

```html
<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:360px;font-family:'Hiragino Sans','Yu Gothic','Meiryo',sans-serif">
  <defs>
    <marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#718096"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="784" height="384" rx="10" fill="#f7fafc" stroke="#718096" stroke-width="2"/>
  <text x="400" y="40" text-anchor="middle" font-size="20" font-weight="bold" fill="#2d3748">ラベル</text>
  <rect x="40" y="60" width="180" height="75" rx="6" fill="white" stroke="#a0aec0" stroke-width="1.5"/>
  <text x="130" y="90" text-anchor="middle" font-size="17" fill="#2d3748">メインテキスト</text>
  <text x="130" y="116" text-anchor="middle" font-size="15" fill="#718096">サブテキスト</text>
  <line x1="220" y1="97" x2="310" y2="97" stroke="#718096" stroke-width="2" marker-end="url(#arr)"/>
  <line x1="400" y1="135" x2="400" y2="170" stroke="#718096" stroke-width="2" marker-end="url(#arr)"/>
</svg>
```

### SVGカラーパレット（グレー系）

| 用途 | カラーコード |
|---|---|
| 外枠ストローク・矢印 | `#718096` |
| 通常ボックスストローク | `#a0aec0` |
| 強調ボックスストローク | `#4a5568` |
| 強調ボックス背景 | `#e2e8f0` |
| 外枠背景 | `#f7fafc` |
| メインテキスト | `#2d3748` |
| サブテキスト | `#718096` |

### SVGサイズ調整のコツ

- `viewBox` の縦横比と `max-height` を合わせてスケーリングを制御
- 1スライドに収める目安：`max-height: 360px`（見出しと共存する場合）
- ボックスが増えて縦長になる場合は `viewBox` の高さを増やし `max-height` を下げる
- **SVGを大きく表示したい場合は `max-height` を増やす**（`width:100%` により横幅は常に最大なので、`max-height` が実質的なスケール制御になる）

### SVG描画の注意点（ハマりやすいポイント）

#### 1. SVG内にHTMLコメントを書かない

Marpはmarkdownレベルで `<!-- -->` コメントをディレクティブとして処理する。SVGタグの内部に書いたコメントも例外なく処理され、SVG構造が壊れて**図が表示されなくなる**。

```html
<!-- NG：SVG内のHTMLコメントはMarpが処理してしまう -->
<svg ...>
  <!-- ユーザー -->
  <rect .../>
</svg>

<!-- OK：コメントは書かない。idで管理する -->
<svg ...>
  <rect id="user-box" .../>
</svg>
```

#### 2. 特殊Unicode文字をSVGテキスト内で使わない

`⚠`・`✗`・`✓` などの記号・絵文字はフォント依存で表示が崩れたりパース時に問題が起きることがある。ASCIIや日本語テキストで代替する。

| 使わない | 代替 |
|---------|------|
| `⚠` | `[注意]` や `※` |
| `✗` | `x` や `NG` |
| `✓` | `o` や `OK` |
| `→`（SVG内テキスト） | `&#x2192;` |

#### 3. `<svg>` 開始タグは1行にまとめる

属性を複数行に分けると、パーサーが意図しない解釈をすることがある。

```html
<!-- NG -->
<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg"
     style="width:100%;max-height:360px;...">

<!-- OK -->
<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:360px;...">
```

#### 4. VS Code プレビューでHTMLを有効化する

VS Code の Marp 拡張はデフォルトでHTMLタグを無効化している。SVGを表示するには設定が必要：

```json
// settings.json
{ "markdown.marp.enableHtml": true }
```

---

## 画像・レイアウト

```markdown
![w:400px](./image.png)          <!-- 幅400px -->
![bg left](./image.png)          <!-- 左半分に画像、右にテキスト -->
![bg right:40%](./image.png)     <!-- 右40%に画像 -->
![bg cover](./image.png)         <!-- 全体を覆う背景画像 -->
```

---

## スライド単位のディレクティブ

| ディレクティブ | 説明 |
|---|---|
| `<!-- _paginate: false -->` | このスライドのページ番号を非表示 |
| `<!-- _class: クラス名 -->` | このスライドにCSSクラスを適用 |
| `<!-- _header: '' -->` | このスライドのヘッダーを非表示 |
| `<!-- backgroundColor: #色 -->` | 以降のスライドの背景色（`_`付きで1枚のみ） |

---

## 出力コマンド

```bash
# HTML出力（ブラウザ不要）
npx @marp-team/marp-cli input.md -o output.html

# PPTX出力（Chromium必要）
npx @marp-team/marp-cli input.md --pptx -o output.pptx

# SVG/HTMLタグを使う場合
npx @marp-team/marp-cli input.md --html --pptx -o output.pptx

# PDF出力
npx @marp-team/marp-cli input.md --pdf -o output.pdf

# ウォッチモード（変更時に自動再変換）
npx @marp-team/marp-cli input.md -o output.html --watch
```

VS Codeの場合：`Ctrl+Shift+P` → `Marp: Export slide deck...`

---

## カラーパレット（テンプレート準拠）

| 用途 | カラーコード |
|---|---|
| h1・タイトル背景（濃） | `#1a365d` |
| h2・アクセント | `#2b6cb0` |
| ボーダー・強調 | `#3182ce` |
| 本文テキスト | `#2d3748` |

ブランドカラーに変更する場合は `#3182ce` と `#1a365d` を一括置換する。

# 機能設計書

## システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    フロントエンド (Next.js)                    │
│  ローカル実行 (localhost:3000)                                │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ストーリー設計UI│ │スライドエディタ│ │      図エディタ        │ │
│  │インタビュー   │ │テキスト編集   │ │ React Flow +         │ │
│  │骨子レビュー   │ │AIチャット     │ │ SVGテンプレート       │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                                                              │
│  ┌──────────────┐  状態管理: zustand（メモリ上、永続化なし）    │
│  │  プレビュー   │  @marp-core でブラウザ内レンダリング          │
│  └──────────────┘                                            │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP / SSE
┌────────────────────────────▼────────────────────────────────┐
│                  API Route (Next.js)                         │
│  同一プロセス内で実行                                          │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ストーリー生成 │ │スライド修正   │ │    エクスポート        │ │
│  │   API (SSE)  │ │   API (SSE)  │ │ Marp CLI → pptx/pdf  │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└──────┬──────────────────────┬───────────────────────────────┘
       │                      │
┌──────▼──────┐    ┌──────────▼──────────────────────────────┐
│ Claude API  │    │       ローカルファイルシステム              │
│ (Anthropic) │    │  素材ファイル読み込み / エクスポート出力     │
└─────────────┘    └─────────────────────────────────────────┘
```

---

## データモデル定義

### 概要

データベースは使用しない。セッション中のデータはzustandストアでメモリ上に保持し、アプリ終了時に破棄される。

```
┌─────────────────────────────────────────┐
│           zustand ストア（メモリ）        │
│                                         │
│  project                                │
│    ├── title                            │
│    ├── mode                             │
│    ├── interviewAnswers                 │
│    ├── themeCSS                         │
│    └── slides[]                         │
│          ├── content                    │
│          ├── figure                     │
│          └── speakerNote                │
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
  ローカルファイル読み込み   エクスポート出力
   （素材ドキュメント）     （md/pptx/pdf/html）
```

### データの流れ

1. **入力**: ローカルファイル/ディレクトリのパスを指定 → ファイル内容を読み込み
2. **処理**: メモリ上でスライドデータを編集
3. **出力**: Marp md / pptx / pdf / html としてローカルファイルに出力

---

## JSONスキーマ定義

### `interview_answers`

```typescript
type InterviewAnswers = {
  audience: string;       // 対象聴衆（例: "社内技術レビュー"）
  goal: string;           // ゴール（例: "本番移行の承認取得"）
  concerns: string;       // 懸念点（例: "コスト・精度の根拠"）
  slideCount?: number;    // 希望スライド枚数（省略時は自動）
  timeMinutes?: number;   // 発表時間（分）
}
```

モード別追加フィールド：

```typescript
// 提案モード
type ProposalAnswers = InterviewAnswers & {
  decisionType: string;   // 何を決めてほしいか（承認 / 予算 / 方向性）
}

// 技術比較モード
type ComparisonAnswers = InterviewAnswers & {
  options: string[];      // 比較対象（例: ["Azure OpenAI", "Gemini"]）
  criteria: string[];     // 比較軸（例: ["コスト", "精度", "運用負荷"]）
  preferred?: string;     // 推したい選択肢
}
```

### `slides.content`（discriminated union）

```typescript
type SlideContent =
  | {
      layout: 'title-bullets';
      title: string;
      bullets: string[];
    }
  | {
      layout: 'title-figure';
      title: string;
      caption?: string;
    }
  | {
      layout: 'two-column';
      title: string;
      left: string[];
      right: string[];
    }
  | {
      layout: 'divider';
      title: string;
      subtitle?: string;
    }
  | {
      layout: 'title-only';
      title: string;
    }
```

### `figures.params`（図タイプ別）

```typescript
// アーキテクチャ図 / フロー図
type GraphParams = {
  nodes: {
    id: string;
    label: string;
    color?: string;
    shape?: 'rect' | 'rounded';
    x?: number;   // ドラッグ後の座標（省略時は自動整列）
    y?: number;
  }[];
  edges: {
    from: string;
    to: string;
    label?: string;
  }[];
  direction: 'horizontal' | 'vertical';
}

// 棒グラフ
type BarChartParams = {
  labels: string[];
  values: number[];
  unit: string;          // 例: "%" "ms" "件"
  targetLine?: number;   // 目標ラインの値
}

// タイムライン
type TimelineParams = {
  items: {
    date: string;
    label: string;
    done: boolean;
  }[];
}

// 比較表
type ComparisonParams = {
  headers: string[];
  rows: {
    label: string;
    values: string[];
  }[];
  recommended?: number;  // 推奨列のインデックス（強調表示）
}
```

### `figures.style`

```typescript
type FigureStyle = {
  primaryColor: string;    // 例: "#534AB7"
  secondaryColor?: string;
  fontSize?: number;       // デフォルト: 12
  showGrid?: boolean;      // 棒グラフのみ
  direction?: 'horizontal' | 'vertical';  // アーキテクチャ/フロー図のみ
}
```

---

## フロントエンド状態管理（zustand）

```typescript
// ストア全体の型
type AppStore = {
  // 現在のプロジェクト
  project: Project | null;

  // UI状態
  currentSlideIndex: number;
  editTab: 'text' | 'figure' | 'style' | 'ai';
  isGenerating: boolean;

  // アクション
  setProject: (project: Project) => void;
  updateSlide: (slideId: string, patch: Partial<Slide>) => void;
  reorderSlides: (orderedIds: string[]) => void;
  updateFigure: (slideId: string, params: Partial<FigureParams>) => void;
  setCurrentSlide: (index: number) => void;
}

// プロジェクト型（セッション中メモリ上で管理）
type Project = {
  id: string;  // セッション内でのユニークID
  title: string;
  mode: ProjectMode;
  interviewAnswers: InterviewAnswers;
  themeCSS: string;
  slides: Slide[];
}

type Slide = {
  id: string;
  orderIndex: number;
  layout: SlideLayout;
  content: SlideContent;
  figure?: Figure;
  speakerNote?: string;
  role: string;
  keyMessage: string;
}
```

---

## API設計

### エンドポイント一覧（Next.js API Route）

#### 素材ファイル読み込み

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/files/read` | ローカルファイル/ディレクトリの内容を読み込み |

#### ストーリー設計（AIあり・SSE）

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/story/generate` | インタビュー回答 → 骨子JSON生成（SSE） |
| POST | `/api/story/refine` | 骨子の再生成（追加指示付き・SSE） |

#### AIスライド修正（SSE）

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/slides/ai` | 自然言語指示 → スライド差分（SSE） |

#### エクスポート

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/export` | エクスポート実行（ローカルファイル出力） |

### 主要リクエスト/レスポンス例

#### `POST /api/files/read`

```json
// Request
{
  "path": "/Users/name/docs/proposal.md"
  // または
  "path": "/Users/name/docs/materials/"  // ディレクトリ指定
}

// Response
{
  "files": [
    { "name": "proposal.md", "content": "..." }
  ]
}
```

#### `POST /api/story/generate`

```json
// Request
{
  "mode": "proposal",
  "interviewAnswers": {
    "audience": "社内技術レビュー",
    "goal": "本番移行の承認取得",
    "concerns": "コスト・精度の根拠",
    "slideCount": 6
  },
  "sourceText": "素材ドキュメントの内容..."
}

// Response (SSE stream)
data: {"type": "slide", "index": 0, "title": "背景と課題", "role": "...", "keyMessage": "...", "suggestedLayout": "title-bullets", "suggestedFigure": null}
data: {"type": "slide", "index": 1, ...}
data: {"type": "done"}
```

#### `POST /api/slides/ai`

```json
// Request
{
  "instruction": "もっと課題感を強調して、図をアーキテクチャ図に変えて",
  "slide": { /* 現在のスライドデータ */ },
  "context": {
    "role": "本番移行の承認を取るためのスライド",
    "keyMessage": "現状のシステムに問題がある"
  }
}

// Response (SSE stream)
data: {"type": "patch", "field": "content.bullets", "value": ["..."]}
data: {"type": "patch", "field": "figure", "value": {"type": "architecture", "params": {...}}}
data: {"type": "done"}
```

#### `POST /api/export`

```json
// Request
{
  "format": "pptx",
  "slides": [ /* スライドデータ */ ],
  "themeCSS": "..."
}

// Response（ブラウザでダウンロード用）
// Content-Type: application/octet-stream
// Content-Disposition: attachment; filename="slides.pptx"
```

---

## 画面遷移図

```
[トップ画面]
        │
        ▼
[素材ファイル指定]
  ローカルパス入力
        │
        ▼
[モード選択]
        │
        ▼
[AIインタビュー]
        │
        ▼
[骨子レビュー]
        │
    OK  │  差し戻し
        │ ─────────┐
        ▼           │
[スライド編集画面]  │
  ├─ サムネイル一覧  │
  ├─ プレビュー      │
  └─ 編集パネル      │
       ├─ テキスト   │
       ├─ 図エディタ  │
       ├─ スタイル   │
       └─ AIチャット  │
        │           │
        ▼           │
[エクスポート] ──────┘
  md / pptx / pdf / html
  （ローカルファイルとして出力）
```

---

## コンポーネント設計

### ページ構成（Next.js App Router）

```
app/
├── page.tsx                          # トップ画面（素材指定・モード選択）
├── story/page.tsx                    # ストーリー設計フェーズ（インタビュー・骨子レビュー）
├── editor/page.tsx                   # スライド編集画面（メイン）
└── api/
    ├── files/read/route.ts           # ローカルファイル読み込み
    ├── story/generate/route.ts       # 骨子生成（SSE）
    ├── story/refine/route.ts         # 骨子再生成（SSE）
    ├── slides/ai/route.ts            # スライドAI修正（SSE）
    └── export/route.ts               # エクスポート
```

### 主要コンポーネント

```
components/
├── story/
│   ├── FilePathInput.tsx             # ローカルファイル/ディレクトリパス入力
│   ├── ModeSelector.tsx              # モード選択ボタン群
│   ├── InterviewForm.tsx             # インタビューフォーム（モード別）
│   ├── OutlineReview.tsx             # 骨子レビュー画面
│   └── SlideCard.tsx                 # 骨子スライドカード
├── editor/
│   ├── EditorLayout.tsx              # 3ペインレイアウト
│   ├── SlideThumbnailList.tsx        # 左: サムネイル一覧
│   ├── SlidePreview.tsx              # 中央: プレビュー
│   └── EditPanel/
│       ├── TextTab.tsx               # テキスト編集タブ
│       ├── FigureTab.tsx             # 図タブ
│       ├── StyleTab.tsx              # スタイルタブ
│       └── AiChatTab.tsx             # AIチャットタブ
├── figure/
│   ├── FigureEditor.tsx              # 図エディタ全体
│   ├── NodeList.tsx                  # 左: ノード定義リスト
│   ├── FigureCanvas.tsx              # 中央: SVGキャンバス
│   ├── PropertiesPanel.tsx           # 右: プロパティパネル
│   └── renderers/
│       ├── ArchitectureRenderer.tsx  # アーキテクチャ図SVG生成
│       ├── FlowRenderer.tsx          # フロー図SVG生成
│       ├── BarChartRenderer.tsx      # 棒グラフSVG生成
│       ├── TimelineRenderer.tsx      # タイムラインSVG生成
│       └── ComparisonRenderer.tsx    # 比較表SVG生成
└── common/
    ├── StreamingText.tsx             # SSEストリーミング表示
    └── ExportButton.tsx              # エクスポートボタン＋進捗
```

### JSON → Marp Markdown 変換

```typescript
// lib/marp-converter.ts
export function toMarpMarkdown(project: Project): string {
  const header = buildHeader(project.themeCSS);
  const pages = project.slides.map(slide => {
    const text = renderContent(slide.content);
    const svg  = slide.figure
      ? renderFigureToSvg(slide.figure)   // フロントエンドのレンダラが生成
      : '';
    return `${text}\n\n${svg}`;
  });
  return [header, ...pages].join('\n\n---\n\n');
}
```

**AIはSVGを生成しない。** figureのparams（ノード・エッジ等のJSON）のみを返し、SVGへの変換は各Rendererが担当する。これによりAIのプロンプトにSVGが含まれず、トークンを節約できる。

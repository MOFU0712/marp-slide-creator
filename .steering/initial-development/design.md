# 初回実装 設計

## 実装アプローチ

Phase 1 はローカル実行可能な構成とする。
Claude API の呼び出しは Next.js の API Route（`/app/api/`）を経由することで、APIキーをブラウザに露出させない。
データはセッション中のみメモリ上に保持し、永続化しない。

```
Browser (React + zustand)
  │
  │ fetch / EventSource
  ▼
Next.js API Route (/app/api/*)    ← APIキーはここだけに置く
  │
  │ @anthropic-ai/sdk
  ▼
Claude API
```

---

## ディレクトリ構成（Phase 1）

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # トップ画面（素材入力・モード選択）
│   ├── story/
│   │   └── page.tsx                      # ストーリー設計フェーズ（インタビュー・骨子レビュー）
│   ├── editor/
│   │   └── page.tsx                      # スライド編集画面
│   └── api/
│       ├── story/
│       │   ├── generate/route.ts         # POST: 骨子生成（SSE）
│       │   └── refine/route.ts           # POST: 骨子再生成（SSE）
│       ├── slides/
│       │   └── ai/route.ts               # POST: スライドAI修正（SSE）
│       └── export/route.ts               # POST: エクスポート
│
├── components/
│   ├── story/
│   │   ├── ModeSelector.tsx
│   │   ├── InterviewForm.tsx
│   │   ├── OutlineReview.tsx
│   │   └── SlideOutlineCard.tsx
│   ├── editor/
│   │   ├── EditorLayout.tsx
│   │   ├── SlideThumbnailList.tsx
│   │   ├── SlidePreview.tsx
│   │   └── EditPanel/
│   │       ├── TextTab.tsx
│   │       ├── FigureTab.tsx
│   │       ├── StyleTab.tsx
│   │       └── AiChatTab.tsx
│   ├── figure/
│   │   ├── FigureEditor.tsx
│   │   ├── NodeList.tsx
│   │   ├── FigureCanvas.tsx
│   │   ├── PropertiesPanel.tsx
│   │   └── renderers/
│   │       ├── ArchitectureRenderer.tsx
│   │       ├── FlowRenderer.tsx
│   │       ├── BarChartRenderer.tsx
│   │       ├── TimelineRenderer.tsx
│   │       └── ComparisonRenderer.tsx
│   └── common/
│       ├── StreamingText.tsx
│       └── ExportButton.tsx
│
├── lib/
│   ├── marp-converter.ts
│   ├── sse-client.ts
│   └── export.ts
│
├── stores/
│   ├── project-store.ts
│   └── ui-store.ts
│
├── types/
│   └── index.ts
│
└── hooks/
    ├── useSlideEditor.ts
    ├── useFigureEditor.ts
    └── useStreamingAI.ts
```

---

## データ構造

### データ管理方針

- データはセッション中のみ zustand ストアでメモリ上に保持
- ページリロードでデータは初期化される
- 作業結果は Marp md エクスポートで保存

### 型定義（`types/index.ts`）

```typescript
export type ProjectMode = 'proposal' | 'report' | 'comparison' | 'research'

export type SlideLayout =
  | 'title-bullets'
  | 'title-figure'
  | 'two-column'
  | 'divider'
  | 'title-only'

export type FigureType =
  | 'architecture'
  | 'flow'
  | 'bar_chart'
  | 'timeline'
  | 'comparison'

// ---- SlideContent ----

export type SlideContent =
  | { layout: 'title-bullets'; title: string; bullets: string[] }
  | { layout: 'title-figure'; title: string; caption?: string }
  | { layout: 'two-column'; title: string; left: string[]; right: string[] }
  | { layout: 'divider'; title: string; subtitle?: string }
  | { layout: 'title-only'; title: string }

// ---- Figure ----

export type GraphNode = {
  id: string
  label: string
  color?: string
  shape?: 'rect' | 'rounded'
  x?: number
  y?: number
}

export type GraphEdge = {
  from: string
  to: string
  label?: string
}

export type FigureParams =
  | { type: 'architecture' | 'flow'; nodes: GraphNode[]; edges: GraphEdge[]; direction: 'horizontal' | 'vertical' }
  | { type: 'bar_chart'; labels: string[]; values: number[]; unit: string; targetLine?: number }
  | { type: 'timeline'; items: { date: string; label: string; done: boolean }[] }
  | { type: 'comparison'; headers: string[]; rows: { label: string; values: string[] }[]; recommended?: number }

export type FigureStyle = {
  primaryColor: string
  secondaryColor?: string
  fontSize?: number
  showGrid?: boolean
}

export type Figure = {
  id: string
  type: FigureType
  params: FigureParams
  style: FigureStyle
}

// ---- Slide ----

export type Slide = {
  id: string
  orderIndex: number
  layout: SlideLayout
  content: SlideContent
  figure?: Figure
  speakerNote?: string
  role: string
  keyMessage: string
}

// ---- Project ----

export type InterviewAnswers = {
  audience: string
  goal: string
  concerns: string
  slideCount?: number
  timeMinutes?: number
  // 提案モード追加フィールド
  decisionType?: string
  // 比較モード追加フィールド
  options?: string[]
  criteria?: string[]
  preferred?: string
}

export type Project = {
  id: string
  title: string
  mode: ProjectMode
  interviewAnswers: InterviewAnswers
  themeCSS: string
  slides: Slide[]
  createdAt: string
  updatedAt: string
}
```

---

## ストア設計（zustand）

### `project-store.ts`

```typescript
type ProjectStore = {
  // 状態（セッション中のみメモリ上に保持）
  project: Project | null

  // アクション
  initProject: (mode: ProjectMode) => void
  updateProject: (patch: Partial<Project>) => void

  updateSlide: (slideId: string, patch: Partial<Slide>) => void
  addSlide: (afterIndex?: number) => void
  deleteSlide: (slideId: string) => void
  reorderSlides: (orderedIds: string[]) => void

  setSlides: (slides: Slide[]) => void        // 骨子確定時に一括セット
  updateFigure: (slideId: string, figure: Figure) => void

  resetProject: () => void                    // プロジェクトをリセット
}
```

### `ui-store.ts`

```typescript
type UiStore = {
  currentSlideIndex: number
  editTab: 'text' | 'figure' | 'style' | 'ai'
  isGenerating: boolean
  figureEditorSlideId: string | null    // 図エディタを開いているスライドのID

  setCurrentSlideIndex: (index: number) => void
  setEditTab: (tab: UiStore['editTab']) => void
  setIsGenerating: (v: boolean) => void
  openFigureEditor: (slideId: string) => void
  closeFigureEditor: () => void
}
```

---

## API Route 設計

### `POST /api/story/generate`

骨子生成。Claude API を SSE でストリーミングし、スライドを順次返す。

```typescript
// Request body
type GenerateStoryRequest = {
  mode: ProjectMode
  interviewAnswers: InterviewAnswers
  sourceText: string              // 素材テキスト（Phase 1 はテキスト貼り付け）
}

// SSE events
type StoryEvent =
  | { type: 'slide'; index: number; title: string; role: string; keyMessage: string; layout: SlideLayout; figure: Pick<Figure, 'type'> | null }
  | { type: 'error'; message: string }
  | { type: 'done' }
```

実装方針：
- `Response` に `Content-Type: text/event-stream` を設定
- Anthropic SDK の `stream()` を使ってトークンを受け取り、JSON が完成したタイミングで SSE イベントを送出
- Claude にはスライド1枚ずつ JSON で返すよう指示する（途中で表示できるようにするため）

### `POST /api/slides/[id]/ai`

スライドAI修正。差分をSSEで返す。

```typescript
// Request body
type SlideAiRequest = {
  instruction: string
  slide: Slide                    // 現在のスライド全体（コンテキスト）
  role: string                    // このスライドの役割
  keyMessage: string
}

// SSE events
type SlideAiEvent =
  | { type: 'patch'; field: string; value: unknown }
  | { type: 'error'; message: string }
  | { type: 'done' }
```

---

## プロンプト設計

### 骨子生成プロンプト

```
[システムプロンプト（モード別・固定）]
あなたはエンジニア向けプレゼンテーションのストーリー設計の専門家です。
{mode_specific_instruction}

スライドの構成は必ず以下の型に従ってください：
- 背景・目的・実験/実装概要・結果・今後の展望・まとめ

各スライドを以下のJSON形式で1枚ずつ出力してください。
他の文字列・マークダウン・説明文は一切含めないこと。
SVGは生成しないこと。

{"index":0,"title":"...","role":"...","keyMessage":"...","layout":"title-bullets","figure":null}

[ユーザープロンプト（動的）]
## 素材ドキュメント
{source_text}

## インタビュー回答
- 対象聴衆: {audience}
- ゴール: {goal}
- 懸念点: {concerns}
- スライド枚数: {slide_count}枚

上記をもとに骨子を生成してください。
```

### スライドAI修正プロンプト

```
[システムプロンプト（固定）]
あなたはエンジニア向けプレゼンテーションのスライド編集アシスタントです。
指示に従って対象スライドの差分のみをJSONで返してください。
変更しないフィールドは含めないこと。SVGは生成しないこと。

差分は以下の形式で1行ずつ出力してください：
{"field":"content.bullets","value":["..."]}

[ユーザープロンプト（動的）]
## 対象スライド
{slide_json}

## このスライドの役割
{role}

## 指示
{instruction}
```

---

## JSON → Marp Markdown 変換（`lib/marp-converter.ts`）

```typescript
export function toMarpMarkdown(project: Project): string {
  const header = buildHeader(project.themeCSS)
  const pages = project.slides
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(slide => buildSlidePage(slide))
  return [header, ...pages].join('\n\n---\n\n')
}

function buildHeader(css: string): string {
  return `---\nmarp: true\nstyle: |\n${css.split('\n').map(l => '  ' + l).join('\n')}\n---`
}

function buildSlidePage(slide: Slide): string {
  const text = buildSlideText(slide.content)
  const svg = slide.figure ? buildFigureSvg(slide.figure) : ''
  const note = slide.speakerNote ? `\n\n<!-- ${slide.speakerNote} -->` : ''
  return [text, svg].filter(Boolean).join('\n\n') + note
}

function buildSlideText(content: SlideContent): string {
  switch (content.layout) {
    case 'title-bullets':
      return `# ${content.title}\n\n${content.bullets.map(b => `- ${b}`).join('\n')}`
    case 'two-column':
      return `# ${content.title}\n\n<div class="columns">\n<div>\n\n${content.left.map(b => `- ${b}`).join('\n')}\n\n</div>\n<div>\n\n${content.right.map(b => `- ${b}`).join('\n')}\n\n</div>\n</div>`
    case 'divider':
      return `# ${content.title}${content.subtitle ? `\n\n${content.subtitle}` : ''}`
    default:
      return `# ${content.title}`
  }
}

// 図パラメータ → SVG 変換は各 Renderer に委譲
function buildFigureSvg(figure: Figure): string {
  return renderFigure(figure)   // renderers/ の関数を呼ぶ
}
```

---

## 影響範囲の分析

### Phase 2 への移行時の変更箇所

| 変更内容 | 影響ファイル | 変更規模 |
|---|---|---|
| テキスト入力 → ローカルファイル指定 | `components/story/` に `FilePathInput.tsx` 追加、`app/api/files/read/route.ts` 追加 | 小（コンポーネント・API追加） |
| エクスポートの拡張（pptx/PDF/HTML） | `app/api/export/route.ts` を拡張 | 小（Marp CLI 統合） |

Phase 1 の設計は Phase 2 の変更を局所化できるように意図している。
ストアのインターフェース（アクション名・引数）は Phase 2 でも変えない。

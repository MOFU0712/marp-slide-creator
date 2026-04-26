# 初回実装 タスクリスト

## 進捗サマリ

| フェーズ | タスク数 | 完了 | 残り |
|---|---|---|---|
| 0. 環境セットアップ | 6 | 0 | 6 |
| 1. 基盤実装 | 5 | 0 | 5 |
| 2. ストーリー設計フェーズ | 6 | 0 | 6 |
| 3. スライド編集フェーズ | 7 | 0 | 7 |
| 4. 図エディタ | 7 | 0 | 7 |
| 5. エクスポート | 2 | 0 | 2 |
| 6. 品質チェック | 4 | 0 | 4 |
| **合計** | **37** | **0** | **37** |

---

## フェーズ 0: 環境セットアップ

- [ ] **0-1** Next.js プロジェクト作成
  ```bash
  pnpm create next-app frontend --typescript --tailwind --app --src-dir=false
  ```

- [ ] **0-2** 依存パッケージのインストール
  ```bash
  pnpm add zustand @marp-team/marp-core @anthropic-ai/sdk
  pnpm add react-flow @xyflow/react
  pnpm add @dnd-kit/core @dnd-kit/sortable    # 骨子レビューのドラッグ&ドロップ
  pnpm add -D vitest @testing-library/react @testing-library/user-event
  ```

- [ ] **0-3** shadcn/ui の初期化
  ```bash
  pnpm dlx shadcn@latest init
  pnpm dlx shadcn@latest add button input textarea select card tabs badge
  ```

- [ ] **0-4** `types/index.ts` の作成
  - `design.md` の型定義をそのまま実装する
  - `ProjectMode` / `SlideLayout` / `FigureType` / `SlideContent` / `Figure` / `Slide` / `Project`

- [ ] **0-5** 環境変数ファイルの作成
  ```bash
  # frontend/.env.local
  ANTHROPIC_API_KEY=sk-ant-...
  ```

- [ ] **0-6** ESLint・Prettier・Tailwind の設定確認
  - `next.config.ts` で strict mode を有効化
  - `tsconfig.json` で `strict: true` を確認

**完了条件：** `pnpm dev` でアプリが起動し、TypeScript エラーがゼロであること

---

## フェーズ 1: 基盤実装

- [ ] **1-1** zustand ストアの実装（`stores/project-store.ts`）
  - `loadProjects` / `createProject` / `loadProject` / `updateProject`
  - `updateSlide` / `addSlide` / `deleteSlide` / `reorderSlides` / `setSlides`
  - `updateFigure`
  - ローカルストレージへの自動同期（`persist` ミドルウェア使用）

- [ ] **1-2** zustand ストアの実装（`stores/ui-store.ts`）
  - `currentSlideIndex` / `editTab` / `isGenerating` / `figureEditorSlideId`
  - 各 setter アクション

- [ ] **1-3** SSE クライアントの実装（`lib/sse-client.ts`）
  - `streamRequest(url, body, onEvent, onDone, onError)` 関数
  - `EventSource` ではなく `fetch` + `ReadableStream` で実装（POST に対応するため）

- [ ] **1-4** プロジェクト一覧画面の実装（`app/projects/page.tsx`）
  - ローカルストレージからプロジェクト一覧を表示
  - 「新規作成」ボタン → ストーリー設計フェーズへ遷移
  - プロジェクトカードをクリック → スライド編集画面へ遷移

- [ ] **1-5** ストアの単体テスト（`stores/project-store.test.ts`）
  - `updateSlide` / `reorderSlides` / `updateFigure` の動作確認

**完了条件：** プロジェクト一覧画面が表示され、新規作成・再開ができること

---

## フェーズ 2: ストーリー設計フェーズ

- [ ] **2-1** モード選択UIの実装（`components/story/ModeSelector.tsx`）
  - 4モードをカード形式で表示
  - 選択状態のハイライト

- [ ] **2-2** インタビューフォームの実装（`components/story/InterviewForm.tsx`）
  - モード別の質問を動的に表示
  - 素材テキストの貼り付けエリア
  - バリデーション（必須項目チェック）

- [ ] **2-3** 骨子生成 API Route の実装（`app/api/story/generate/route.ts`）
  - `POST` リクエストを受け取り SSE でレスポンスを返す
  - `design.md` のプロンプト設計を実装
  - Claude API のエラーハンドリング（429・500 等）

- [ ] **2-4** 骨子レビューUIの実装（`components/story/OutlineReview.tsx`）
  - スライドカード一覧（`@dnd-kit` でドラッグ&ドロップ）
  - 右サイドパネル（キーメッセージ・スライドへの指示・インタビュー参照）
  - 「骨子を再生成」ボタン（追加指示テキストエリア付き）
  - 「編集フェーズへ」ボタン

- [ ] **2-5** ストーリー設計ページの実装（`app/projects/[id]/story/page.tsx`）
  - ステップインジケーター（素材読込 → インタビュー → 骨子レビュー）
  - 各ステップのコンポーネントを切り替えて表示

- [ ] **2-6** 骨子生成フローの結合テスト
  - モード選択 → インタビュー入力 → 骨子生成 → 骨子レビュー → 承認 の動作確認

**完了条件：** 素材テキストを貼り付けてインタビューに答えると骨子が生成され、スライド編集画面に遷移できること

---

## フェーズ 3: スライド編集フェーズ

- [ ] **3-1** 3ペインレイアウトの実装（`components/editor/EditorLayout.tsx`）
  - 左: サムネイル一覧（固定幅 140px）
  - 中央: プレビュー（可変幅）
  - 右: 編集パネル（固定幅 240px）
  - トップバー（タイトル・エクスポートボタン）

- [ ] **3-2** スライドサムネイル一覧の実装（`components/editor/SlideThumbnailList.tsx`）
  - スライドカードのリスト表示
  - クリックで選択
  - 図ありスライドのサムネイル表示

- [ ] **3-3** @marp-core によるプレビューの実装（`components/editor/SlidePreview.tsx`）
  - `Project` → Marp Markdown 変換（`lib/marp-converter.ts`）
  - `@marp-team/marp-core` でHTML生成
  - `dangerouslySetInnerHTML` でレンダリング（XSS対策: Marp の sanitize オプションを使用）
  - テキスト変更から 500ms のデバウンスで更新

- [ ] **3-4** テキストタブの実装（`components/editor/EditPanel/TextTab.tsx`）
  - タイトル入力
  - 本文（箇条書き、1行1項目のテキストエリア）
  - スピーカーノート入力
  - 「プレビューに反映」ボタン

- [ ] **3-5** スタイルタブの実装（`components/editor/EditPanel/StyleTab.tsx`）
  - レイアウト選択（セレクトボックス）
  - テーマCSS 編集テキストエリア（全スライドに適用）
  - アクセントカラーのカラーピッカー（CSS変数を更新）

- [ ] **3-6** AIチャットタブの実装（`components/editor/EditPanel/AiChatTab.tsx`）
  - チャット履歴表示
  - 入力欄 + 送信ボタン
  - API Route 呼び出し（SSE）
  - 差分をストアに反映

- [ ] **3-7** スライドAI修正 API Route の実装（`app/api/slides/[id]/ai/route.ts`）
  - `design.md` のプロンプト設計を実装
  - 差分 JSON をSSEで返す

**完了条件：** テキスト編集・AI修正・スタイル変更がプレビューに反映されること

---

## フェーズ 4: 図エディタ

- [ ] **4-1** SVGレンダラの実装（`components/figure/renderers/`）
  - `ArchitectureRenderer.tsx`: ノード・エッジ → SVG
  - `FlowRenderer.tsx`: ノード・エッジ → SVG（角丸・矢印のスタイル差異）
  - `BarChartRenderer.tsx`: ラベル・値 → 棒グラフ SVG
  - `TimelineRenderer.tsx`: items → タイムライン SVG
  - `ComparisonRenderer.tsx`: headers・rows → 比較表 SVG
  - 各レンダラの単体テスト（`renderers/*.test.tsx`）

- [ ] **4-2** JSON → Marp Markdown 変換の実装（`lib/marp-converter.ts`）
  - `toMarpMarkdown(project)` 関数
  - `design.md` の実装をそのまま実装
  - 単体テスト（全レイアウト・全図タイプのスナップショットテスト）

- [ ] **4-3** SVGキャンバスの実装（`components/figure/FigureCanvas.tsx`）
  - ノードのドラッグ移動（`onMouseDown` / `onMouseMove` / `onMouseUp`）
  - ノードのクリック選択
  - エッジの描画（テキスト定義から動的生成）
  - 自動整列ボタン

- [ ] **4-4** ノード定義パネルの実装（`components/figure/NodeList.tsx`）
  - ノードリスト（クリックで選択・× で削除）
  - 「+ ノードを追加」ボタン
  - エッジ定義テキストエリア（`from → to` 形式）

- [ ] **4-5** プロパティパネルの実装（`components/figure/PropertiesPanel.tsx`）
  - ラベル入力
  - カラー選択（カラースウォッチグリッド）
  - 形状選択（四角 / 丸角）
  - サイズ入力（W・H）
  - 「このノードを削除」ボタン

- [ ] **4-6** 図エディタ全体の統合（`components/figure/FigureEditor.tsx`）
  - 3ペインレイアウト（ノード定義 / キャンバス / プロパティ）
  - 図タイプ切り替えタブ
  - 方向切り替えボタン（横 / 縦）
  - 「スライドに挿入」ボタン → `updateFigure` を呼ぶ

- [ ] **4-7** 図タブからの図エディタ起動（`components/editor/EditPanel/FigureTab.tsx`）
  - 図タイプ選択グリッド
  - 図エディタをモーダルまたはサイドパネルで表示

**完了条件：** 図タイプを選択・編集してスライドに挿入するとプレビューに反映されること

---

## フェーズ 5: エクスポート

- [ ] **5-1** Marp Markdown エクスポートの実装（`lib/export.ts`）
  - `exportAsMarpMarkdown(project)` 関数
  - `toMarpMarkdown` の結果を Blob に変換してダウンロード

- [ ] **5-2** エクスポートボタンの実装（`components/common/ExportButton.tsx`）
  - 「Marp出力」ボタン → `.md` ファイルをダウンロード
  - トップバーに配置

**完了条件：** ダウンロードした `.md` ファイルを Marp CLI で変換するとスライドが生成されること

---

## フェーズ 6: 品質チェック

- [ ] **6-1** 単体テストの実行・修正
  ```bash
  pnpm vitest run
  ```
  - `stores/project-store.test.ts`
  - `lib/marp-converter.test.ts`
  - `components/figure/renderers/*.test.tsx`

- [ ] **6-2** TypeScript 型チェックの実行・修正
  ```bash
  pnpm tsc --noEmit
  ```

- [ ] **6-3** ESLint の実行・修正
  ```bash
  pnpm eslint . --fix
  ```

- [ ] **6-4** 主要フローの手動確認
  - [ ] 新規プロジェクト作成 → ストーリー設計 → 骨子生成 → 骨子承認
  - [ ] スライド編集（テキスト・AI修正・スタイル）
  - [ ] 図エディタ（アーキテクチャ図の作成・編集・挿入）
  - [ ] Marp md エクスポート → Marp CLI で変換確認
  - [ ] ページリロード後のデータ復元確認

**完了条件：** テスト全パス・型エラーゼロ・主要フローが手動で動作すること

---

## コミットメッセージ例

各フェーズ完了時のコミット：

```
feat: 環境セットアップと型定義を追加
feat: zustandストアとSSEクライアントを実装
feat: ストーリー設計フェーズを実装（モード選択・インタビュー・骨子生成）
feat: スライド編集フェーズを実装（3ペイン・プレビュー・AIチャット）
feat: 図エディタを実装（5種類のSVGレンダラ・ノード操作）
feat: Marp mdエクスポートを実装
chore: 単体テストと型チェックをパス
```

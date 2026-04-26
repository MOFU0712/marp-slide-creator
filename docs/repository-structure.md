# リポジトリ構造定義書

## 全体構成

モノレポ構成を採用する。フロントエンド・バックエンドを1リポジトリで管理することで、スキーマ変更時の追跡・デプロイの一元管理を容易にする。

```
slide-ai/
├── frontend/                    # Next.js アプリケーション
├── backend/                     # FastAPI アプリケーション
├── shared/                      # 型定義など共有リソース
├── docs/                        # 永続的ドキュメント
├── .steering/                   # 作業単位のステアリングファイル
├── .github/                     # GitHub Actions ワークフロー
├── docker-compose.yml           # ローカル開発用
└── README.md
```

---

## フロントエンド (`frontend/`)

```
frontend/
├── app/                                  # Next.js App Router
│   ├── layout.tsx                        # ルートレイアウト
│   ├── page.tsx                          # ランディング / リダイレクト
│   ├── login/
│   │   └── page.tsx                      # ログイン
│   └── projects/
│       ├── page.tsx                      # プロジェクト一覧
│       └── [id]/
│           ├── page.tsx                  # スライド編集画面（メイン）
│           ├── story/
│           │   └── page.tsx              # ストーリー設計フェーズ
│           └── export/
│               └── page.tsx              # エクスポート
│
├── components/                           # UIコンポーネント
│   ├── story/                            # ストーリー設計フェーズ
│   │   ├── ModeSelector.tsx
│   │   ├── InterviewForm.tsx
│   │   ├── OutlineReview.tsx
│   │   └── SlideCard.tsx
│   ├── editor/                           # スライド編集画面
│   │   ├── EditorLayout.tsx
│   │   ├── SlideThumbnailList.tsx
│   │   ├── SlidePreview.tsx
│   │   └── EditPanel/
│   │       ├── TextTab.tsx
│   │       ├── FigureTab.tsx
│   │       ├── StyleTab.tsx
│   │       └── AiChatTab.tsx
│   ├── figure/                           # 図エディタ
│   │   ├── FigureEditor.tsx
│   │   ├── NodeList.tsx
│   │   ├── FigureCanvas.tsx
│   │   ├── PropertiesPanel.tsx
│   │   └── renderers/                    # 図タイプ別SVGレンダラ
│   │       ├── ArchitectureRenderer.tsx
│   │       ├── FlowRenderer.tsx
│   │       ├── BarChartRenderer.tsx
│   │       ├── TimelineRenderer.tsx
│   │       └── ComparisonRenderer.tsx
│   └── common/                           # 汎用コンポーネント
│       ├── StreamingText.tsx
│       └── ExportButton.tsx
│
├── lib/                                  # ユーティリティ・ビジネスロジック
│   ├── marp-converter.ts                 # JSON → Marp Markdown 変換
│   ├── api-client.ts                     # バックエンドAPIクライアント
│   ├── sse-client.ts                     # SSEストリーミングクライアント
│   └── export.ts                         # エクスポートユーティリティ
│
├── stores/                               # zustand ストア
│   ├── project-store.ts                  # プロジェクト・スライド状態
│   └── ui-store.ts                       # UI状態（選択中スライド・タブ等）
│
├── types/                                # TypeScript 型定義
│   └── index.ts                          # shared/ から再エクスポート
│
├── hooks/                                # カスタムフック
│   ├── useSlideEditor.ts
│   ├── useFigureEditor.ts
│   └── useStreamingAI.ts
│
├── public/                               # 静的ファイル
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## バックエンド (`backend/`)

```
backend/
├── app/
│   ├── main.py                           # FastAPI エントリポイント
│   ├── routers/                          # APIルーター（エンドポイント定義）
│   │   ├── projects.py                   # /projects
│   │   ├── files.py                      # /projects/:id/files
│   │   ├── story.py                      # /projects/:id/story
│   │   ├── slides.py                     # /projects/:id/slides
│   │   └── export.py                     # /projects/:id/export
│   ├── services/                         # ビジネスロジック
│   │   ├── story_service.py              # 骨子生成ロジック
│   │   ├── slide_service.py              # スライド修正ロジック
│   │   ├── export_service.py             # エクスポートジョブ管理
│   │   └── ai_service.py                 # Claude API 呼び出し共通処理
│   ├── models/                           # Pydantic モデル（リクエスト・レスポンス）
│   │   ├── project.py
│   │   ├── slide.py
│   │   ├── figure.py
│   │   └── export.py
│   ├── db/                               # Supabase クライアント・クエリ
│   │   ├── client.py
│   │   └── queries/
│   │       ├── projects.py
│   │       └── slides.py
│   ├── prompts/                          # プロンプトテンプレート
│   │   ├── story_generation.py           # 骨子生成プロンプト（モード別）
│   │   └── slide_refinement.py           # スライド修正プロンプト
│   └── config.py                         # 環境変数・設定
│
├── tests/
│   ├── test_story.py
│   ├── test_slides.py
│   └── test_export.py
│
├── pyproject.toml                        # uv / Ruff 設定
└── Dockerfile
```

---

## 共有リソース (`shared/`)

```
shared/
└── types/
    ├── project.ts                        # Project / ProjectMode 型
    ├── slide.ts                          # Slide / SlideContent / SlideLayout 型
    └── figure.ts                         # Figure / FigureParams 型
```

フロントエンドは `shared/types/` を直接参照する。
バックエンドは Pydantic モデルとして同等の定義を `backend/app/models/` に持つ（Pythonと TypeScriptで共有できないため）。

---

## ドキュメント (`docs/`)

```
docs/
├── product-requirements.md              # プロダクト要求定義書
├── functional-design.md                 # 機能設計書
├── architecture.md                      # 技術仕様書
├── repository-structure.md              # 本ファイル
├── development-guidelines.md            # 開発ガイドライン
└── glossary.md                          # ユビキタス言語定義
```

---

## ステアリングファイル (`.steering/`)

```
.steering/
├── 20250424-initial-implementation/     # 初回実装
│   ├── requirements.md
│   ├── design.md
│   └── tasklist.md
└── YYYYMMDD-[開発タイトル]/             # 以降の作業単位
    ├── requirements.md
    ├── design.md
    └── tasklist.md
```

---

## CI/CD (`.github/`)

```
.github/
└── workflows/
    ├── ci.yml                            # PR時: lint・型チェック・ユニットテスト
    ├── deploy-frontend.yml               # main マージ時: Vercel デプロイ
    ├── deploy-backend.yml                # main マージ時: Lambda / Cloud Run デプロイ
    └── e2e.yml                           # リリースタグ時: Playwright E2E
```

---

## ローカル開発環境

```yaml
# docker-compose.yml の構成
services:
  frontend:    # Next.js dev server (port 3000)
  backend:     # FastAPI dev server (port 8000)
  supabase:    # Supabase local (port 54321)  ※ supabase CLI を使用
```

### 起動手順

```bash
# 依存インストール
cd frontend && pnpm install
cd ../backend && uv sync

# Supabase ローカル起動
supabase start

# 開発サーバー起動（フロント・バック並列）
docker-compose up
```

---

## ファイル配置ルール

### コンポーネントファイル

- 1ファイル1コンポーネントを原則とする
- コンポーネント名はPascalCase、ファイル名もPascalCase
- テストファイルは同ディレクトリに `ComponentName.test.tsx` として配置

### ユーティリティ・フック

- `lib/` : フレームワーク非依存のロジック（変換処理・APIクライアント）
- `hooks/` : Reactのカスタムフック（`use` プレフィックス必須）
- `stores/` : zustand ストア（`-store.ts` サフィックス）

### プロンプトテンプレート

- `backend/app/prompts/` に集約し、ロジックと分離する
- モード別・用途別にファイルを分ける
- プロンプトの変更履歴をGitで追跡できるようにする

### 環境変数

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# backend/.env
ANTHROPIC_API_KEY=...           # フロントエンドには絶対に置かない
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
AWS_S3_BUCKET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

`ANTHROPIC_API_KEY` はバックエンドの `.env` のみに記載し、フロントエンドの環境変数には一切含めない。

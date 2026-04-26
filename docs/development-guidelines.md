# 開発ガイドライン

## コーディング規約

### 共通

- 言語設定：コード内のコメント・変数名・関数名は英語、ドキュメント・コミットメッセージ・PRは日本語
- インデント：スペース2つ（フロントエンド）、スペース4つ（バックエンド）
- 行末の空白は禁止
- ファイル末尾は改行1つ

### TypeScript（フロントエンド）

```typescript
// ✅ 良い例
type SlideContent = {
  layout: 'title-bullets';
  title: string;
  bullets: string[];
};

// ❌ 悪い例：interface より type を優先する
interface SlideContent {
  layout: string;   // リテラル型を使う
  title: string;
}
```

- `type` を `interface` より優先する（discriminated union との相性のため）
- `any` は禁止。不明な型は `unknown` を使い、型ガードで絞り込む
- 非nullアサーション（`!`）は原則禁止。オプショナルチェーン（`?.`）を使う
- `as` によるキャストは最小限に抑える
- 関数の戻り値型は明示する（推論に頼りすぎない）
- React コンポーネントの props 型は同ファイル内に定義する

```typescript
// ✅ props 型の定義例
type SlideCardProps = {
  slide: Slide;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export function SlideCard({ slide, isSelected, onSelect }: SlideCardProps) {
  // ...
}
```

### Python（バックエンド）

- 型アノテーションを全関数に必須とする
- Pydantic モデルを使ってリクエスト・レスポンスを定義する
- `Optional[X]` より `X | None` を優先する（Python 3.10+）
- 非同期関数（`async def`）を基本とする

```python
# ✅ 良い例
async def generate_story(
    project_id: str,
    answers: InterviewAnswers,
) -> AsyncIterator[SlideOutline]:
    ...

# ❌ 悪い例
def generate_story(project_id, answers):
    ...
```

---

## 命名規則

### TypeScript

| 対象 | 規則 | 例 |
|---|---|---|
| コンポーネント | PascalCase | `SlideCard`, `FigureEditor` |
| フック | camelCase + `use` プレフィックス | `useSlideEditor`, `useStreamingAI` |
| ストア | camelCase + `Store` サフィックス | `projectStore`, `uiStore` |
| 型・インターフェース | PascalCase | `SlideContent`, `FigureParams` |
| 定数 | SCREAMING_SNAKE_CASE | `MAX_SLIDE_COUNT`, `DEFAULT_THEME` |
| 関数・変数 | camelCase | `renderFigureToSvg`, `currentSlideIndex` |
| ファイル（コンポーネント） | PascalCase | `SlideCard.tsx`, `FigureEditor.tsx` |
| ファイル（ユーティリティ） | kebab-case | `marp-converter.ts`, `api-client.ts` |

### Python

| 対象 | 規則 | 例 |
|---|---|---|
| クラス | PascalCase | `StoryService`, `SlideRouter` |
| 関数・変数 | snake_case | `generate_story`, `project_id` |
| 定数 | SCREAMING_SNAKE_CASE | `MAX_SLIDE_COUNT` |
| ファイル | snake_case | `story_service.py`, `slide_router.py` |
| Pydantic モデル | PascalCase | `InterviewAnswers`, `SlideOutline` |

### API エンドポイント

- リソース名は複数形・kebab-case：`/projects`, `/source-files`
- ネストは2階層まで：`/projects/:id/slides/:sid`
- 動詞は使わない（HTTPメソッドで表現）：`/projects/:id/story/generate` は例外（AIアクションのため）

---

## スタイリング規約

### Tailwind CSS

- クラスの順序：レイアウト → サイズ → スペーシング → 色 → その他
- 長いクラス列は `cn()` ユーティリティでまとめる

```tsx
// ✅ cn() を使った例
import { cn } from '@/lib/utils';

<div className={cn(
  'flex items-center gap-2 px-3 py-2',
  'rounded-lg border text-sm',
  isSelected && 'border-purple-500 bg-purple-50',
  isDisabled && 'opacity-50 cursor-not-allowed',
)} />
```

- マジックナンバーの色は禁止。Tailwind のカラーパレットか CSS変数を使う
- レスポンシブは `sm:` `md:` `lg:` のブレークポイントで対応
- ダークモード：`dark:` プレフィックスで対応

### コンポーネントスタイル方針

- shadcn/ui のコンポーネントをベースに使用する
- カスタマイズは `components/ui/` 内のshadcnファイルを編集する形で行う
- インラインスタイル（`style={{}}`）は禁止。Tailwindクラスで表現できない場合のみ許可

---

## テスト規約

### フロントエンド（Vitest + React Testing Library）

**必ずテストを書く対象：**

- `lib/` 内のユーティリティ関数（特に `marp-converter.ts`、各SVGレンダラ）
- zustand ストアのアクション
- カスタムフックの主要ロジック

**テストを書かなくてよい対象：**

- 単純な表示コンポーネント（propsをそのまま表示するだけのもの）
- shadcn/ui をそのまま使っているコンポーネント

```typescript
// ✅ ユーティリティのテスト例
describe('toMarpMarkdown', () => {
  it('タイトル+箇条書きスライドを正しくMarkdownに変換する', () => {
    const project = createTestProject({
      slides: [{
        layout: 'title-bullets',
        content: { title: 'テスト', bullets: ['項目1', '項目2'] },
      }],
    });
    const md = toMarpMarkdown(project);
    expect(md).toContain('# テスト');
    expect(md).toContain('- 項目1');
  });
});
```

### バックエンド（pytest）

**必ずテストを書く対象：**

- 全APIエンドポイント（正常系・異常系）
- `services/` 内のビジネスロジック
- プロンプト生成関数（モード別に期待する文字列が含まれるか）

```python
# ✅ APIテスト例
async def test_generate_story_returns_slides(client, mock_claude):
    mock_claude.return_value = mock_story_stream()
    response = await client.post(
        f"/projects/{project_id}/story/generate",
        json={"interviewAnswers": {...}, "sourceFileIds": []},
    )
    assert response.status_code == 200
    events = parse_sse(response.text)
    assert any(e["type"] == "slide" for e in events)
    assert any(e["type"] == "done" for e in events)
```

---

## Git 規約

### ブランチ戦略

```
main          # 本番環境（直接pushは禁止）
  └── feature/[機能名]      # 機能開発
  └── fix/[バグ名]          # バグ修正
  └── docs/[ドキュメント名]  # ドキュメント更新
  └── refactor/[対象]       # リファクタリング
```

### コミットメッセージ

日本語で記述する。以下のプレフィックスを使用する：

| プレフィックス | 用途 |
|---|---|
| `feat:` | 新機能の追加 |
| `fix:` | バグ修正 |
| `docs:` | ドキュメントのみの変更 |
| `refactor:` | 機能変更を伴わないコードの整理 |
| `test:` | テストの追加・修正 |
| `chore:` | ビルド設定・依存関係の更新 |
| `style:` | フォーマットのみの変更 |

```bash
# ✅ 良い例
feat: 骨子生成のSSEストリーミングを実装
fix: 図エディタでノード削除後にエッジが残る問題を修正
docs: functional-design.md にJSONスキーマ定義を追加

# ❌ 悪い例
update files
WIP
fix bug
```

### PRの作成ルール

- PRタイトルはコミットメッセージと同じ形式
- PRの説明には「何を・なぜ・どうやって」を記載する
- レビュー前に自分でdiffを確認し、不要なファイルが含まれていないか確認する
- WIPのPRは `[WIP]` プレフィックスをつける

### マージ戦略

- `main` へのマージは Squash merge を使用する
- ブランチは マージ後に削除する

---

## プロンプト管理規約

プロンプトはコードと同等の資産として管理する。

### ファイル構成

```
backend/app/prompts/
├── story_generation.py     # モード別の骨子生成プロンプト
└── slide_refinement.py     # スライド修正プロンプト
```

### 記述ルール

- プロンプトは関数として定義し、動的な部分を引数で受け取る
- システムプロンプト（固定部分）と動的コンテキストを分離する
- プロンプトの変更は必ずコミットメッセージに `prompt:` を追記する

```python
# ✅ プロンプト関数の例
def build_story_prompt(
    mode: ProjectMode,
    interview_answers: InterviewAnswers,
    source_text: str,
    slide_count: int,
) -> tuple[str, str]:
    """
    Returns: (system_prompt, user_prompt)
    """
    system = SYSTEM_PROMPTS[mode]  # 固定部分
    user = f"""
## 素材ドキュメント
{source_text}

## インタビュー回答
- 対象聴衆: {interview_answers.audience}
- ゴール: {interview_answers.goal}
- 懸念点: {interview_answers.concerns}

## 指示
上記の素材とインタビュー回答をもとに、{slide_count}枚のスライド骨子を生成してください。
以下のJSON形式で出力してください（他の文字列は含めないこと）：
...
"""
    return system, user
```

---

## エラーハンドリング規約

### フロントエンド

- API エラーは `api-client.ts` で一元的にハンドリングする
- ユーザーに見せるエラーメッセージは日本語で具体的に書く
- SSE ストリーミング中のエラーは `StreamingText` コンポーネントで表示する

```typescript
// ✅ エラーハンドリング例
try {
  await generateStory(projectId, answers);
} catch (e) {
  if (e instanceof ApiError && e.status === 429) {
    toast.error('AIの利用制限に達しました。しばらく待ってから再試行してください。');
  } else {
    toast.error('骨子の生成に失敗しました。もう一度お試しください。');
  }
}
```

### バックエンド

- HTTPエラーは FastAPI の `HTTPException` を使う
- Claude API のエラーは `services/ai_service.py` で一元的にハンドリングする
- エラーログには `project_id`・`user_id` を必ず含める

```python
# ✅ エラーハンドリング例
@router.post("/projects/{project_id}/story/generate")
async def generate_story(project_id: str, ...):
    try:
        async for event in story_service.generate(project_id, answers):
            yield event
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Claude APIのレート制限に達しました")
    except anthropic.APIError as e:
        logger.error(f"Claude API error: {e}", extra={"project_id": project_id})
        raise HTTPException(status_code=502, detail="AI処理中にエラーが発生しました")
```

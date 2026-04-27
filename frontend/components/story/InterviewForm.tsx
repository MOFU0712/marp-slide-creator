'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProjectStore } from '@/stores/project-store'
import type { InterviewAnswers, ProjectMode } from '@/types'
import { useCallback, useRef, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'

type InterviewFormProps = {
  onSubmit: (answers: InterviewAnswers, sourceText: string) => void
  isSubmitting: boolean
}

type ModeConfig = {
  title: string
  questions: {
    key: keyof InterviewAnswers
    label: string
    placeholder: string
    type: 'text' | 'textarea' | 'number' | 'array'
  }[]
}

const MODE_CONFIGS: Record<ProjectMode, ModeConfig> = {
  proposal: {
    title: '提案資料',
    questions: [
      {
        key: 'audience',
        label: '対象聴衆',
        placeholder: '例: 社内技術レビュー、経営会議',
        type: 'text',
      },
      {
        key: 'goal',
        label: 'ゴール',
        placeholder: '例: 本番移行の承認取得',
        type: 'text',
      },
      {
        key: 'concerns',
        label: '懸念点',
        placeholder: '例: コスト・精度の根拠',
        type: 'textarea',
      },
      {
        key: 'decisionType',
        label: '決定タイプ',
        placeholder: '例: 承認、予算、方向性',
        type: 'text',
      },
      {
        key: 'slideCount',
        label: '希望スライド枚数',
        placeholder: '例: 6',
        type: 'number',
      },
    ],
  },
  report: {
    title: '実装報告',
    questions: [
      {
        key: 'audience',
        label: '対象聴衆',
        placeholder: '例: 社内技術レビュー',
        type: 'text',
      },
      {
        key: 'goal',
        label: 'ゴール',
        placeholder: '例: 実装内容の共有と次ステップの合意',
        type: 'text',
      },
      {
        key: 'concerns',
        label: '懸念点・課題',
        placeholder: '例: 今後の課題、改善点',
        type: 'textarea',
      },
      {
        key: 'slideCount',
        label: '希望スライド枚数',
        placeholder: '例: 8',
        type: 'number',
      },
    ],
  },
  comparison: {
    title: '技術比較',
    questions: [
      {
        key: 'audience',
        label: '対象聴衆',
        placeholder: '例: 技術選定会議',
        type: 'text',
      },
      {
        key: 'goal',
        label: 'ゴール',
        placeholder: '例: 技術選定の合意形成',
        type: 'text',
      },
      {
        key: 'options',
        label: '比較対象（カンマ区切り）',
        placeholder: '例: Azure OpenAI, Gemini, Claude',
        type: 'array',
      },
      {
        key: 'criteria',
        label: '評価基準（カンマ区切り）',
        placeholder: '例: コスト, 精度, 運用負荷',
        type: 'array',
      },
      {
        key: 'preferred',
        label: '推奨案',
        placeholder: '例: Claude',
        type: 'text',
      },
      {
        key: 'slideCount',
        label: '希望スライド枚数',
        placeholder: '例: 10',
        type: 'number',
      },
    ],
  },
  research: {
    title: '調査報告',
    questions: [
      {
        key: 'audience',
        label: '対象聴衆',
        placeholder: '例: 技術チーム',
        type: 'text',
      },
      {
        key: 'goal',
        label: 'ゴール',
        placeholder: '例: 調査結果の共有と次アクションの決定',
        type: 'text',
      },
      {
        key: 'concerns',
        label: '調査のポイント・懸念点',
        placeholder: '例: 技術的な制約、導入リスク',
        type: 'textarea',
      },
      {
        key: 'slideCount',
        label: '希望スライド枚数',
        placeholder: '例: 6',
        type: 'number',
      },
    ],
  },
}

type UploadedFile = {
  name: string
  content: string
}

export function InterviewForm({ onSubmit, isSubmitting }: InterviewFormProps) {
  const project = useProjectStore((state) => state.project)
  const [answers, setAnswers] = useState<InterviewAnswers>({
    audience: '',
    goal: '',
    concerns: '',
  })
  const [sourceText, setSourceText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: UploadedFile[] = []

    for (const file of Array.from(files)) {
      // テキストベースのファイルのみ対応
      if (!file.name.match(/\.(txt|md|markdown|json|yaml|yml|csv|log|xml|html|css|js|ts|jsx|tsx|py|rb|go|rs|java|c|cpp|h|sh|sql)$/i)) {
        alert(`${file.name} は対応していないファイル形式です。テキストファイルをアップロードしてください。`)
        continue
      }

      try {
        const content = await file.text()
        newFiles.push({ name: file.name, content })
      } catch (error) {
        console.error(`Failed to read ${file.name}:`, error)
        alert(`${file.name} の読み込みに失敗しました。`)
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles])
      // ファイル内容をsourceTextに追加
      const combinedContent = newFiles
        .map((f) => `--- ${f.name} ---\n${f.content}`)
        .join('\n\n')
      setSourceText((prev) => prev ? `${prev}\n\n${combinedContent}` : combinedContent)
    }

    // inputをリセット（同じファイルを再度選択可能にする）
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleRemoveFile = useCallback((fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName))
  }, [])

  if (!project) return null

  const config = MODE_CONFIGS[project.mode]

  const handleChange = (key: keyof InterviewAnswers, value: string | number | string[]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(answers, sourceText)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{config.title}のインタビュー</h3>
        <p className="text-sm text-muted-foreground">
          以下の質問に答えて、スライドの骨子を生成しましょう。
        </p>
      </div>

      <div className="space-y-4">
        {config.questions.map((q) => (
          <div key={q.key} className="space-y-2">
            <Label htmlFor={q.key}>{q.label}</Label>
            {q.type === 'textarea' ? (
              <Textarea
                id={q.key}
                placeholder={q.placeholder}
                value={(answers[q.key] as string) || ''}
                onChange={(e) => handleChange(q.key, e.target.value)}
                rows={3}
              />
            ) : q.type === 'number' ? (
              <Input
                id={q.key}
                type="number"
                placeholder={q.placeholder}
                value={(answers[q.key] as number) || ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '') {
                    setAnswers((prev) => {
                      const next = { ...prev }
                      delete next[q.key]
                      return next
                    })
                  } else {
                    handleChange(q.key, parseInt(val) || 0)
                  }
                }}
                min={1}
                max={30}
              />
            ) : q.type === 'array' ? (
              <Input
                id={q.key}
                placeholder={q.placeholder}
                value={(answers[q.key] as string[])?.join(', ') || ''}
                onChange={(e) =>
                  handleChange(
                    q.key,
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
              />
            ) : (
              <Input
                id={q.key}
                placeholder={q.placeholder}
                value={(answers[q.key] as string) || ''}
                onChange={(e) => handleChange(q.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceText">素材テキスト</Label>
        <p className="text-sm text-muted-foreground">
          スライドの元となるドキュメントやメモを貼り付け、またはファイルをアップロードしてください。
        </p>

        {/* ファイルアップロードエリア */}
        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown,.json,.yaml,.yml,.csv,.log,.xml,.html,.css,.js,.ts,.jsx,.tsx,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.sh,.sql"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            ファイルをアップロード
          </Button>
          <span className="text-xs text-muted-foreground">
            .txt, .md, .json, .yaml, .csv など
          </span>
        </div>

        {/* アップロードされたファイル一覧 */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
              >
                <FileText className="h-3 w-3" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.name)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Textarea
          id="sourceText"
          placeholder="実装ドキュメント、設計メモ、調査結果などを貼り付けてください..."
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={10}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {sourceText.length.toLocaleString()} 文字
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !sourceText.trim()}>
        {isSubmitting ? '骨子を生成中...' : '骨子を生成'}
      </Button>
    </form>
  )
}

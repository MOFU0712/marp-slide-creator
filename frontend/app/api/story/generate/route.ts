import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod/v4'

const requestSchema = z.object({
  mode: z.enum(['proposal', 'report', 'comparison', 'research']),
  interviewAnswers: z.object({
    audience: z.string(),
    goal: z.string(),
    concerns: z.string().optional(),
    slideCount: z.number().optional(),
    timeMinutes: z.number().optional(),
    decisionType: z.string().optional(),
    options: z.array(z.string()).optional(),
    criteria: z.array(z.string()).optional(),
    preferred: z.string().optional(),
  }),
  sourceText: z.string(),
})

type ProjectMode = 'proposal' | 'report' | 'comparison' | 'research'

const MODE_INSTRUCTIONS: Record<ProjectMode, string> = {
  proposal: `あなたはエンジニア向けの「提案資料」の構成を設計するスペシャリストです。
聴衆を説得し、承認を得ることを目的としたストーリー構成を設計してください。
典型的な構成: 背景・課題 → 提案内容 → 期待効果 → リスク対策 → スケジュール → まとめ`,

  report: `あなたはエンジニア向けの「実装報告資料」の構成を設計するスペシャリストです。
実装の成果を明確に伝え、次のアクションにつなげることを目的としたストーリー構成を設計してください。
典型的な構成: 背景・目的 → 実装概要 → 技術詳細 → 結果・成果 → 課題・今後の展望 → まとめ`,

  comparison: `あなたはエンジニア向けの「技術比較資料」の構成を設計するスペシャリストです。
複数の選択肢を公平に比較し、最適な選択を導くことを目的としたストーリー構成を設計してください。
典型的な構成: 背景・目的 → 比較対象の概要 → 評価基準 → 比較結果 → 推奨案 → まとめ`,

  research: `あなたはエンジニア向けの「調査報告資料」の構成を設計するスペシャリストです。
調査結果を分かりやすく伝え、次のアクションにつなげることを目的としたストーリー構成を設計してください。
典型的な構成: 背景・目的 → 調査方法 → 調査結果 → 考察・分析 → 提言 → まとめ`,
}

const SYSTEM_PROMPT = `あなたはエンジニア向けプレゼンテーションの骨子設計の専門家です。

ユーザーから提供される素材とインタビュー回答をもとに、スライドの骨子を設計してください。
素材ドキュメントの内容を活かし、具体的な内容を含むスライドを作成してください。

## 出力形式
各スライドを以下のJSON形式で**1行ずつ**出力してください。
他の文字列・マークダウン・説明文は一切含めないでください。

{"index":0,"title":"スライドタイトル","role":"このスライドの役割","keyMessage":"伝えたいキーメッセージ","layout":"title-bullets","bullets":["箇条書き1","箇条書き2","箇条書き3"],"figure":null}

## layoutの選択肢と対応するコンテンツ
- "title-bullets": タイトル + 箇条書き → bullets配列を指定（3〜5項目）
- "title-figure": タイトル + 図 → caption（図の説明）を指定、bullets不要
- "two-column": 2カラム構成 → left配列とright配列を指定（各2〜4項目）
- "divider": セクション区切り → subtitle（サブタイトル）を指定、bullets不要
- "title-only": タイトルのみ → bullets不要

## figureの指定
図が必要な場合のみ、以下の形式で詳細なパラメータを指定してください:

### アーキテクチャ図 / フロー図
{"type":"architecture","params":{"nodes":[{"id":"1","label":"Client"},{"id":"2","label":"Server"}],"edges":[{"from":"1","to":"2","label":"Request"}],"direction":"horizontal"}}
{"type":"flow","params":{"nodes":[{"id":"1","label":"開始"},{"id":"2","label":"処理"},{"id":"3","label":"終了"}],"edges":[{"from":"1","to":"2"},{"from":"2","to":"3"}],"direction":"horizontal"}}

### 棒グラフ
{"type":"bar_chart","params":{"labels":["Q1","Q2","Q3","Q4"],"values":[65,80,72,90],"unit":"%","targetLine":75}}

### タイムライン
{"type":"timeline","params":{"items":[{"date":"2024/01","label":"企画","done":true},{"date":"2024/06","label":"開発","done":false}]}}

### 比較表
{"type":"comparison","params":{"headers":["項目","プランA","プランB"],"rows":[{"label":"価格","values":["¥1,000","¥3,000"]}],"recommended":1}}

図が不要な場合は null

## 注意事項
- SVGは生成しないでください
- 各スライドは1行のJSONで出力してください
- JSONの前後に説明文を付けないでください
- 素材ドキュメントから具体的な数値、技術名、ポイントを抽出して箇条書きに含めてください
- 箇条書きは簡潔に、1項目20文字以内を目安にしてください`

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const parseResult = requestSchema.safeParse(body)
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: parseResult.error }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { mode, interviewAnswers, sourceText } = parseResult.data

  const modeInstruction = MODE_INSTRUCTIONS[mode]
  const slideCount = interviewAnswers.slideCount || 6

  let userPrompt = `## モード別指示
${modeInstruction}

## 素材ドキュメント
${sourceText}

## インタビュー回答
- 対象聴衆: ${interviewAnswers.audience}
- ゴール: ${interviewAnswers.goal}
- 懸念点: ${interviewAnswers.concerns || '特になし'}
- スライド枚数: ${slideCount}枚`

  if (mode === 'proposal' && interviewAnswers.decisionType) {
    userPrompt += `\n- 決定タイプ: ${interviewAnswers.decisionType}`
  }

  if (mode === 'comparison') {
    if (interviewAnswers.options?.length) {
      userPrompt += `\n- 比較対象: ${interviewAnswers.options.join(', ')}`
    }
    if (interviewAnswers.criteria?.length) {
      userPrompt += `\n- 評価基準: ${interviewAnswers.criteria.join(', ')}`
    }
    if (interviewAnswers.preferred) {
      userPrompt += `\n- 推奨案: ${interviewAnswers.preferred}`
    }
  }

  userPrompt += `\n\n上記をもとに、${slideCount}枚のスライド骨子を生成してください。`

  const client = new Anthropic({ apiKey })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = await client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        })

        let buffer = ''

        for await (const event of messageStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            buffer += event.delta.text

            // Process complete lines
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                try {
                  const parsed = JSON.parse(trimmed)
                  if (typeof parsed.index === 'number' && parsed.title) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({
                        type: 'slide',
                        index: parsed.index,
                        title: parsed.title,
                        role: parsed.role || '',
                        keyMessage: parsed.keyMessage || '',
                        layout: parsed.layout || 'title-bullets',
                        bullets: parsed.bullets,
                        left: parsed.left,
                        right: parsed.right,
                        subtitle: parsed.subtitle,
                        caption: parsed.caption,
                        figure: parsed.figure,
                      })}\n\n`)
                    )
                  }
                } catch {
                  // Not valid JSON, ignore
                }
              }
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim()
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const parsed = JSON.parse(trimmed)
              if (typeof parsed.index === 'number' && parsed.title) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'slide',
                    index: parsed.index,
                    title: parsed.title,
                    role: parsed.role || '',
                    keyMessage: parsed.keyMessage || '',
                    layout: parsed.layout || 'title-bullets',
                    bullets: parsed.bullets,
                    left: parsed.left,
                    right: parsed.right,
                    subtitle: parsed.subtitle,
                    caption: parsed.caption,
                    figure: parsed.figure,
                  })}\n\n`)
                )
              }
            } catch {
              // Not valid JSON, ignore
            }
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
        controller.close()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod/v4'

const slideSchema = z.object({
  id: z.string(),
  orderIndex: z.number(),
  layout: z.enum(['title-bullets', 'title-figure', 'two-column', 'divider', 'title-only']),
  content: z.object({
    layout: z.string(),
    title: z.string(),
  }).passthrough(),
  role: z.string(),
  keyMessage: z.string(),
  figure: z.object({
    type: z.string(),
  }).optional().nullable(),
})

const requestSchema = z.object({
  currentSlides: z.array(slideSchema),
  instruction: z.string(),
  mode: z.enum(['proposal', 'report', 'comparison', 'research']),
  sourceText: z.string(),
})

const SYSTEM_PROMPT = `あなたはエンジニア向けプレゼンテーションの骨子設計の専門家です。

ユーザーから既存の骨子と修正指示が提供されます。指示に従って骨子を修正してください。
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
- {"type":"architecture"}: アーキテクチャ図
- {"type":"flow"}: フロー図
- {"type":"bar_chart"}: 棒グラフ
- {"type":"timeline"}: タイムライン
- {"type":"comparison"}: 比較表
- 図が不要な場合は null

## 注意事項
- SVGは生成しないでください
- 各スライドは1行のJSONで出力してください
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

  const { currentSlides, instruction, sourceText } = parseResult.data

  const currentOutline = currentSlides
    .map((s, i) => `${i + 1}. ${s.content.title} (${s.role})`)
    .join('\n')

  const userPrompt = `## 現在の骨子
${currentOutline}

## 素材ドキュメント（参考）
${sourceText.substring(0, 2000)}${sourceText.length > 2000 ? '...(省略)' : ''}

## 修正指示
${instruction}

上記の指示に従って骨子を修正し、全スライドを出力してください。`

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

import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod/v4'

const requestSchema = z.object({
  instruction: z.string(),
  slide: z.object({
    id: z.string(),
    orderIndex: z.number(),
    layout: z.enum(['title-bullets', 'title-figure', 'two-column', 'divider', 'title-only']),
    content: z.object({
      layout: z.string(),
      title: z.string(),
    }).passthrough(),
    role: z.string(),
    keyMessage: z.string(),
    figure: z.any().optional(),
    speakerNote: z.string().optional(),
  }),
  role: z.string(),
  keyMessage: z.string(),
})

const SYSTEM_PROMPT = `あなたはエンジニア向けプレゼンテーションのスライド編集アシスタントです。
指示に従って対象スライドの差分のみをJSONで返してください。
変更しないフィールドは含めないこと。SVGは生成しないこと。

差分は以下の形式で1行ずつ出力してください：
{"field":"content.bullets","value":["項目1","項目2"]}

変更可能なフィールド:
- content.title: タイトル
- content.bullets: 箇条書き項目（配列）
- content.left: 左カラム（配列）
- content.right: 右カラム（配列）
- content.subtitle: サブタイトル
- content.caption: キャプション
- speakerNote: スピーカーノート

注意:
- 1つの変更につき1行のJSONで出力
- 説明文は含めない
- JSONの前後にマークダウンや説明を付けない`

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

  const { instruction, slide, role, keyMessage } = parseResult.data

  const userPrompt = `## 対象スライド
${JSON.stringify(slide.content, null, 2)}

## このスライドの役割
${role}

## キーメッセージ
${keyMessage}

## 指示
${instruction}

上記の指示に従って、スライドの差分をJSON形式で出力してください。`

  const client = new Anthropic({ apiKey })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = await client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
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
                  if (parsed.field && parsed.value !== undefined) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({
                        type: 'patch',
                        field: parsed.field,
                        value: parsed.value,
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
              if (parsed.field && parsed.value !== undefined) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'patch',
                    field: parsed.field,
                    value: parsed.value,
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

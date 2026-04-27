/**
 * SSE Client for POST requests
 *
 * Since EventSource only supports GET requests, we use fetch + ReadableStream
 * to handle Server-Sent Events from POST endpoints.
 */

export type SSEOptions<T> = {
  onEvent: (event: T) => void
  onDone: () => void
  onError: (error: Error) => void
}

/**
 * Stream a POST request with SSE response
 */
export async function streamRequest<T>(
  url: string,
  body: unknown,
  options: SSEOptions<T>
): Promise<void> {
  const { onEvent, onDone, onError } = options

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // Process any remaining data in buffer
        if (buffer.trim()) {
          processBuffer(buffer, onEvent)
        }
        onDone()
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE messages
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onDone()
            return
          }
          try {
            const parsed = JSON.parse(data) as T
            onEvent(parsed)
          } catch {
            // Ignore non-JSON data lines
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)))
  }
}

function processBuffer<T>(buffer: string, onEvent: (event: T) => void): void {
  const lines = buffer.split('\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6)
      if (data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data) as T
          onEvent(parsed)
        } catch {
          // Ignore non-JSON data lines
        }
      }
    }
  }
}

/**
 * Create an AbortController for cancelling requests
 */
export function createAbortController(): AbortController {
  return new AbortController()
}

/**
 * Stream a POST request with SSE response (with abort support)
 */
export async function streamRequestWithAbort<T>(
  url: string,
  body: unknown,
  options: SSEOptions<T>,
  signal?: AbortSignal
): Promise<void> {
  const { onEvent, onDone, onError } = options

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        if (buffer.trim()) {
          processBuffer(buffer, onEvent)
        }
        onDone()
        break
      }

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onDone()
            return
          }
          try {
            const parsed = JSON.parse(data) as T
            onEvent(parsed)
          } catch {
            // Ignore non-JSON data lines
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Request was cancelled, don't call onError
      return
    }
    onError(error instanceof Error ? error : new Error(String(error)))
  }
}

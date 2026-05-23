import { useState, useRef, useEffect } from 'react'
import api from '../lib/api'
import { Spinner } from '../components/ui'

const SUGGESTIONS = [
  'Which devices are currently offline?',
  'Are there any latency anomalies right now?',
  'What is the overall health of my network?',
  'Which device has the highest average latency?',
]

function Message({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
        style={{ backgroundColor: isUser ? 'var(--accent)' : 'var(--card-border)' }}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'text-white rounded-tr-sm'
            : 'text-gray-200 rounded-tl-sm'
        }`}
        style={{
          backgroundColor: isUser ? 'var(--accent)' : 'var(--card-bg)',
          border: isUser ? 'none' : '1px solid var(--card-border)',
        }}
      >
        {content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: 'var(--card-border)' }}
      >
        AI
      </div>
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

export default function AiChat() {
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const message = (text ?? input).trim()
    if (!message || loading) return

    const userMsg = { role: 'user', content: message }
    const history = [...messages, userMsg]

    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/ai/chat', {
        message,
        history: messages,
      })
      setMessages([...history, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...history, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6 pb-8">
            <div>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                AI
              </div>
              <h2 className="text-xl font-semibold text-white mb-1">NeTPulse AI</h2>
              <p className="text-sm text-gray-400 max-w-sm">
                Ask me anything about your network — device status, latency, alerts, or anything else.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm px-4 py-3 rounded-xl border text-gray-300 hover:text-white transition-all"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <Message key={i} role={m.role} content={m.content} />
            ))}
            {loading && <TypingIndicator />}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="px-6 py-4 border-t"
        style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--content-bg)' }}
      >
        <div
          className="flex items-end gap-3 rounded-xl border px-4 py-3"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your network..."
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none leading-relaxed max-h-32"
            style={{ fieldSizing: 'content' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {loading
              ? <Spinner size="sm" />
              : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )
            }
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Powered by Groq · Press Enter to send, Shift+Enter for new line
        </p>
      </div>

    </div>
  )
}

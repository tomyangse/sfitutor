'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react'
import type { Locale } from '@/app/[lang]/dictionaries'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatbotProps {
  lang: Locale
  dict?: any
}

export function Chatbot({ lang, dict }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: lang === 'zh' ? '你好！我是你的 AI 瑞典语助教。有什么我可以帮你的吗？' : 'Hej! How can I help you with your Swedish today?' }
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)

    // Add empty assistant message placeholder to attach the stream to
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) throw new Error('API Error')
      if (!res.body) throw new Error('No body in response')

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1].content += chunk
            return updated
          })
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className={`chatbot-fab ${isOpen ? 'hidden' : ''}`} 
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Tutor"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="chat-title">
            <Bot size={20} />
            <span>AI Tutor</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="chat-body">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble-wrapper ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="chat-avatar bg-primary">
                  <Bot size={16} />
                </div>
              )}
              <div className={`chat-bubble ${msg.role}`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="chat-avatar bg-muted">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
          {isStreaming && (
            <div className="chat-bubble-wrapper assistant streaming">
               <div className="chat-avatar bg-primary">
                  <Bot size={16} />
                </div>
               <div className="chat-typing">
                 <span>.</span><span>.</span><span>.</span>
               </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-footer">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === 'zh' ? '输入问题 / Type your question...' : 'Type your question...'}
            disabled={isStreaming}
          />
          <button type="submit" disabled={!input.trim() || isStreaming}>
            <Send size={18} />
          </button>
        </form>
      </div>

      <style jsx>{`
        .chatbot-fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(51, 153, 255, 0.4);
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 50;
        }
        .chatbot-fab:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(51, 153, 255, 0.5);
        }
        .chatbot-fab.hidden {
          opacity: 0;
          transform: scale(0.8);
          pointer-events: none;
        }

        .chatbot-window {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 380px;
          height: 600px;
          max-height: calc(100vh - 4rem);
          max-width: calc(100vw - 2rem);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform: translateY(20px) scale(0.95);
          opacity: 0;
          pointer-events: none;
          z-index: 60;
        }
        .chatbot-window.open {
          transform: translateY(0) scale(1);
          opacity: 1;
          pointer-events: auto;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800));
          color: white;
        }
        .chat-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }
        .close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .chat-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .chat-bubble-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          max-width: 85%;
        }
        .chat-bubble-wrapper.user {
          margin-left: auto;
          flex-direction: row;
        }
        .chat-bubble-wrapper.assistant {
          margin-right: auto;
        }

        .chat-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .chat-avatar.bg-primary {
          background: var(--color-primary-100);
          color: var(--color-primary-600);
        }
        .chat-avatar.bg-muted {
          background: var(--muted);
          color: var(--muted-foreground);
        }

        .chat-bubble {
          padding: 0.75rem 1rem;
          border-radius: 1.25rem;
          font-size: 0.9375rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .chat-bubble.assistant {
          background: rgba(59, 130, 246, 0.08); /* slight primary tint */
          color: var(--foreground);
          border-bottom-left-radius: 0.25rem;
        }
        .chat-bubble.user {
          background: var(--color-primary-500);
          color: white;
          border-bottom-right-radius: 0.25rem;
        }

        .chat-typing {
          display: flex;
          gap: 0.25rem;
          padding: 0.5rem;
        }
        .chat-typing span {
          width: 4px;
          height: 4px;
          background: var(--color-primary-500);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .chat-typing span:nth-child(1) { animation-delay: -0.32s; }
        .chat-typing span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .chat-footer {
          padding: 1rem;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 0.5rem;
          background: var(--card);
        }
        .chat-footer input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          outline: none;
          font-size: 0.9375rem;
          background: var(--background);
          color: var(--foreground);
          transition: border-color 0.2s;
        }
        .chat-footer input:focus {
          border-color: var(--color-primary-500);
        }
        .chat-footer button {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--color-primary-500);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .chat-footer button:disabled {
          background: var(--muted);
          color: var(--muted-foreground);
          cursor: not-allowed;
        }
        .chat-footer button:not(:disabled):hover {
          background: var(--color-primary-600);
          transform: scale(1.05);
        }

        /* Mobile specific styling */
        @media (max-width: 640px) {
          .chatbot-window {
            bottom: 0;
            right: 0;
            width: 100vw;
            height: 100dvh;
            max-height: 100dvh;
            max-width: 100vw;
            border-radius: 0;
            transform: translateY(100%);
          }
          .chatbot-window.open {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}

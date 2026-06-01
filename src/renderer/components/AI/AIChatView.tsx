import { useState, useEffect, useRef } from 'react'
import type { AIChat, AIMessage } from '../../types'

const QUICK_PROMPTS = [
  { label: '总结页面', prompt: '请总结当前页面的主要内容' },
  { label: '解释代码', prompt: '请解释这段代码的作用' },
  { label: '翻译', prompt: '请翻译成中文' },
  { label: '表格呈现', prompt: '请以表格形式呈现' }
]

interface AIChatViewProps {
  currentChatId: string | null
  onChatChange: (chatId: string) => void
  currentPageUrl?: string
}

export default function AIChatView({ currentChatId, onChatChange, currentPageUrl }: AIChatViewProps) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<AIChat[]>([])
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadChatHistory()
    if (!currentChatId) {
      createNewChat()
    }
  }, [])

  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId)
    }
  }, [currentChatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatHistory = async () => {
    try {
      const history = await window.electronAPI?.ai?.getChatHistory()
      setChatHistory(history || [])
    } catch (err) {
      console.error('Failed to load chat history:', err)
    }
  }

  const loadMessages = async (chatId: string) => {
    try {
      const msgs = await window.electronAPI?.ai?.getChatMessages(chatId)
      setMessages(msgs || [])
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  const createNewChat = async () => {
    try {
      const chat = await window.electronAPI?.ai?.createChat()
      if (chat) {
        onChatChange(chat.id)
        setChatHistory(prev => [chat, ...prev])
      }
    } catch (err) {
      console.error('Failed to create chat:', err)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !currentChatId || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    setError(null)

    // 添加用户消息
    const tempUserMsg: AIMessage = {
      id: `temp_${Date.now()}`,
      chatId: currentChatId,
      role: 'user',
      content: userMessage,
      createdAt: Date.now()
    }
    setMessages(prev => [...prev, tempUserMsg])

    // 添加临时助手消息占位
    const tempAssistantId = `temp_assistant_${Date.now()}`
    setMessages(prev => [...prev, {
      id: tempAssistantId,
      chatId: currentChatId,
      role: 'assistant',
      content: '',
      createdAt: Date.now()
    }])

    try {
      const result = await window.electronAPI?.ai?.chat({
        chatId: currentChatId,
        message: userMessage,
        systemPrompt: ''
      })

      if (result?.success) {
        // 更新助手消息
        setMessages(prev => prev.map(msg =>
          msg.id === tempAssistantId
            ? { ...msg, content: result.message }
            : msg
        ))
        // 更新对话标题
        loadChatHistory()
      } else {
        setError(result?.error || 'AI响应失败')
        // 移除临时助手消息
        setMessages(prev => prev.filter(msg => msg.id !== tempAssistantId))
      }
    } catch (err: any) {
      setError(err.message || '发送失败')
      setMessages(prev => prev.filter(msg => msg.id !== tempAssistantId))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定删除这个对话？')) return
    try {
      await window.electronAPI?.ai?.deleteChat(chatId)
      setChatHistory(prev => prev.filter(c => c.id !== chatId))
      if (currentChatId === chatId) {
        createNewChat()
      }
    } catch (err) {
      console.error('Failed to delete chat:', err)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 对话历史列表（可折叠） */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs text-gray-400">对话历史</span>
          <button
            onClick={createNewChat}
            className="text-xs text-primary hover:text-primary-dark"
          >
            + 新对话
          </button>
        </div>
        <div className="flex gap-1 px-2 pb-2 overflow-x-auto">
          {chatHistory.slice(0, 5).map(chat => (
            <button
              key={chat.id}
              onClick={() => onChatChange(chat.id)}
              className={`flex-shrink-0 px-2 py-1 rounded text-xs truncate max-w-24 ${
                currentChatId === chat.id
                  ? 'bg-primary/20 text-primary'
                  : 'bg-dark hover:bg-gray-700 text-gray-400'
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-2">开始智能对话</h3>
            <p className="text-gray-400 text-sm mb-6">基于本地大模型，为您提供AI对话服务</p>

            {/* 快捷提示 */}
            <div className="flex flex-wrap gap-2 justify-center max-w-xs">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt.label}
                  onClick={() => handleQuickPrompt(prompt.prompt)}
                  className="px-3 py-1.5 bg-dark-lighter border border-border rounded-full text-xs text-gray-300 hover:text-white hover:border-primary transition-colors"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-dark-lighter text-gray-100 rounded-bl-md'
              }`}
            >
              {msg.role === 'assistant' && msg.id.startsWith('temp_assistant_') && isLoading && messages[messages.length - 1].id === msg.id ? (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">思考中</span>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-2 text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            rows={1}
            className="flex-1 px-3 py-2 bg-dark border border-border rounded-xl text-white text-sm resize-none focus:outline-none focus:border-primary placeholder-gray-500"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-gray-700 disabled:text-gray-500 rounded-xl text-white text-sm font-medium transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

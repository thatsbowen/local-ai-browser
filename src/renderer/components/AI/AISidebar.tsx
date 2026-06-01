import { useState, useEffect, useRef } from 'react'
import AILogo from './AILogo'
import AIModelConfig from './AIModelConfig'
import AIChatView from './AIChatView'

interface AISidebarProps {
  isOpen: boolean
  onClose: () => void
  currentPageUrl?: string
}

export default function AISidebar({ isOpen, onClose, currentPageUrl }: AISidebarProps) {
  const [showConfig, setShowConfig] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  const sidebarRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭（移动端）
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        // 检查是否点击了AI按钮
        const aiButton = document.querySelector('[data-ai-button]')
        if (aiButton && aiButton.contains(e.target as Node)) return
        // onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <>
      {/* 遮罩层（移动端） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <div
        ref={sidebarRef}
        className={`
          fixed lg:relative right-0 top-0 bottom-0 w-[420px] max-w-full
          bg-dark-lighter border-l border-border
          flex flex-col z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-full lg:w-0 lg:border-0'}
        `}
      >
        {/* 顶栏 */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <AILogo size={32} animated={isOpen} />
            <div>
              <h2 className="text-sm font-semibold text-white">本地AI助手</h2>
              <p className="text-xs text-gray-400">基于大语言模型</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="设置"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded transition-colors lg:hidden"
              title="关闭"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 配置面板 */}
        {showConfig ? (
          <AIModelConfig onClose={() => setShowConfig(false)} />
        ) : (
          <AIChatView
            currentChatId={currentChatId}
            onChatChange={setCurrentChatId}
            currentPageUrl={currentPageUrl}
          />
        )}
      </div>
    </>
  )
}

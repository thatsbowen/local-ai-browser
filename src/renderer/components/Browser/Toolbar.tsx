import { useState, useRef, useCallback } from 'react'
import AILogo from '../AI/AILogo'

interface ToolbarProps {
  currentUrl: string
  onUrlChange: (url: string) => void
  onAiButtonClick: () => void
  aiActive: boolean
  onNavigationChange: (canGoBack: boolean, canGoForward: boolean) => void
}

export default function Toolbar({
  currentUrl,
  onUrlChange,
  onAiButtonClick,
  aiActive,
  onNavigationChange
}: ToolbarProps) {
  const [inputValue, setInputValue] = useState(currentUrl)
  const [isLoading, setIsLoading] = useState(false)
  const webviewRef = useRef<Electron.WebviewTag | null>(null)

  // 更新地址栏内容
  const updateAddressBar = useCallback((url: string) => {
    setInputValue(url)
  }, [])

  // 监听webview事件
  const handleWebViewRef = (wv: Electron.WebviewTag | null) => {
    if (wv) {
      webviewRef.current = wv

      wv.addEventListener('did-start-loading', () => setIsLoading(true))
      wv.addEventListener('did-stop-loading', () => {
        setIsLoading(false)
        updateAddressBar(wv.getURL())
        onNavigationChange(wv.canGoBack(), wv.canGoForward())
      })

      wv.addEventListener('did-navigate', (e) => {
        updateAddressBar(e.url)
      })

      wv.addEventListener('did-navigate-in-page', (e) => {
        updateAddressBar(e.url)
      })
    }
  }

  // 暴露webview引用给父组件
  ;(window as any).__webviewRef = webviewRef

  const handleBack = () => {
    webviewRef.current?.goBack()
  }

  const handleForward = () => {
    webviewRef.current?.goForward()
  }

  const handleRefresh = () => {
    webviewRef.current?.reload()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let url = inputValue.trim()

    // 如果不是有效URL，尝试作为搜索词
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url
      } else {
        url = `https://www.baidu.com/s?wd=${encodeURIComponent(url)}`
      }
    }

    onUrlChange(url)
    webviewRef.current?.loadURL(url)
  }

  return (
    <div className="h-12 bg-dark-lighter flex items-center gap-2 px-2 border-b border-border">
      {/* 导航按钮 */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="后退"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleForward}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="前进"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="刷新"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 地址栏 */}
      <form onSubmit={handleSubmit} className="flex-1 mx-2">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full h-8 px-3 bg-dark border border-border rounded text-sm text-white focus:outline-none focus:border-primary"
            placeholder="输入网址或搜索内容..."
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </form>

      {/* 书签按钮 */}
      <button
        className="p-2 hover:bg-gray-700 rounded transition-colors"
        title="书签"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>

      {/* AI按钮 */}
      <button
        onClick={onAiButtonClick}
        className={`flex items-center gap-2 px-3 h-8 rounded transition-all ${
          aiActive
            ? 'bg-primary text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
        title="AI助手"
      >
        <AILogo size={20} animated={aiActive} />
        <span className="text-sm font-medium">AI</span>
      </button>
    </div>
  )
}

export { }

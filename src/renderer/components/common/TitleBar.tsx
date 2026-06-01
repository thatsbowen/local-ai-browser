import { useState, useEffect } from 'react'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI?.window?.isMaximized().then(setIsMaximized)
    window.electronAPI?.window?.onMaximizeChange(setIsMaximized)
  }, [])

  const handleMinimize = () => window.electronAPI?.window?.minimize()
  const handleMaximize = () => {
    window.electronAPI?.window?.maximize()
    setIsMaximized(!isMaximized)
  }
  const handleClose = () => window.electronAPI?.window?.close()

  return (
    <div className="h-8 bg-dark-lighter flex items-center justify-between border-b border-border drag-region">
      {/* Logo和标题 */}
      <div className="flex items-center px-3 gap-2">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">AI</span>
        </div>
        <span className="text-xs text-gray-300 no-drag">本地化AI智能浏览器</span>
      </div>

      {/* 窗口控制按钮 */}
      <div className="flex items-center h-full no-drag">
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-gray-700 transition-colors"
          title="最小化"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
            <rect y="5" width="12" height="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-gray-700 transition-colors"
          title={isMaximized ? "还原" : "最大化"}
        >
          {isMaximized ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 12 12">
              <rect x="2" y="0" width="8" height="8" strokeWidth="1" />
              <rect x="0" y="4" width="8" height="8" strokeWidth="1" fill="transparent" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 12 12">
              <rect x="0.5" y="0.5" width="11" height="11" strokeWidth="1" />
            </svg>
          )}
        </button>
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-600 transition-colors"
          title="关闭"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}

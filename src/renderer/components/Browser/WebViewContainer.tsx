import { useEffect, useRef } from 'react'

interface WebViewContainerProps {
  currentUrl: string
  onUrlChange: (url: string) => void
}

export default function WebViewContainer({ currentUrl, onUrlChange }: WebViewContainerProps) {
  const webviewRef = useRef<HTMLDivElement>(null)
  const webviewTagRef = useRef<Electron.WebviewTag | null>(null)

  useEffect(() => {
    if (!webviewRef.current || webviewTagRef.current) return

    // 创建webview
    const webview = document.createElement('webview')
    webview.style.width = '100%'
    webview.style.height = '100%'
    webview.style.border = 'none'
    webview.src = currentUrl

    webviewRef.current.appendChild(webview)
    webviewTagRef.current = webview as any

    // 暴露给window
    ;(window as any).__webview = webview

    return () => {
      if (webviewTagRef.current) {
        webviewTagRef.current.remove()
        webviewTagRef.current = null
      }
    }
  }, [])

  // 当URL变化时加载新页面
  useEffect(() => {
    if (webviewTagRef.current) {
      const currentPageUrl = webviewTagRef.current.getURL()
      if (currentPageUrl !== currentUrl) {
        webviewTagRef.current.loadURL(currentUrl)
      }
    }
  }, [currentUrl])

  return <div ref={webviewRef} className="w-full h-full" />
}

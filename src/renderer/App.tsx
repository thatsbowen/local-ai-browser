import { useState, useRef, useEffect } from 'react'
import TitleBar from './components/common/TitleBar'
import Toolbar from './components/Browser/Toolbar'
import TabBar from './components/Browser/TabBar'
import WebViewContainer from './components/Browser/WebViewContainer'
import AISidebar from './components/AI/AISidebar'
import { WindowStateProvider } from './hooks/useWindowState'

function App() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('https://www.baidu.com')
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  return (
    <WindowStateProvider>
      <div className="h-screen flex flex-col bg-dark overflow-hidden">
        {/* 标题栏 */}
        <TitleBar />

        {/* 工具栏 */}
        <Toolbar
          currentUrl={currentUrl}
          onUrlChange={setCurrentUrl}
          onAiButtonClick={() => setAiSidebarOpen(!aiSidebarOpen)}
          aiActive={aiSidebarOpen}
          onNavigationChange={(back, forward) => {
            setCanGoBack(back)
            setCanGoForward(forward)
          }}
        />

        {/* 标签栏 */}
        <TabBar />

        {/* 主内容区 */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1">
            <WebViewContainer
              currentUrl={currentUrl}
              onUrlChange={setCurrentUrl}
            />
          </div>

          {/* AI侧边栏 */}
          <AISidebar
            isOpen={aiSidebarOpen}
            onClose={() => setAiSidebarOpen(false)}
            currentPageUrl={currentUrl}
          />
        </div>
      </div>
    </WindowStateProvider>
  )
}

export default App

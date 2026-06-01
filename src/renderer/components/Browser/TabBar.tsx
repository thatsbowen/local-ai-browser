import { useState } from 'react'

interface Tab {
  id: string
  url: string
  title: string
}

export default function TabBar() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', url: 'https://www.baidu.com', title: '新标签页' }
  ])
  const [activeTabId, setActiveTabId] = useState('1')

  const handleNewTab = () => {
    const newId = Date.now().toString()
    setTabs([...tabs, { id: newId, url: 'about:blank', title: '新标签页' }])
    setActiveTabId(newId)
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    if (tabs.length === 1) return
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[newTabs.length - 1].id)
    }
  }

  return (
    <div className="h-9 bg-dark flex items-end px-1 border-b border-border">
      <div className="flex items-end gap-0.5 overflow-x-auto">
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`group relative flex items-center gap-2 px-3 h-8 rounded-t cursor-pointer transition-colors ${
              activeTabId === tab.id
                ? 'bg-dark-lighter text-white'
                : 'bg-dark text-gray-400 hover:text-white hover:bg-dark-lighter/50'
            }`}
          >
            <span className="text-xs truncate max-w-32">{tab.title}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded p-0.5 transition-opacity"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            )}
            {activeTabId === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleNewTab}
        className="ml-1 p-1.5 hover:bg-gray-700 rounded transition-colors"
        title="新建标签页"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import AddressBar from './components/AddressBar.vue'
import AIChatPanel from './components/AIChatPanel.vue'
import BrowserView from './components/BrowserView.vue'
import AIButton from './components/AIButton.vue'

const aiPanelOpen = ref(false)
const currentUrl = ref('')
const currentTitle = ref('')

const toggleAIPanel = () => {
  aiPanelOpen.value = !aiPanelOpen.value
}

const onNavigate = (url: string, title: string) => {
  currentUrl.value = url
  currentTitle.value = title
}

onMounted(() => {
  // 监听来自 webview 的导航事件
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.data?.type === 'navigate') {
      currentUrl.value = e.data.url || ''
      currentTitle.value = e.data.title || ''
    }
  })
})
</script>

<template>
  <div class="app-container">
    <!-- 顶部标题栏 + 地址栏 -->
    <header class="app-header">
      <div class="header-left">
        <img src="/icon.svg" alt="Logo" class="app-logo" />
        <span class="app-title">本地AI智能浏览器</span>
      </div>
      <AddressBar @navigate="onNavigate" />
      <AIButton @toggle="toggleAIPanel" :active="aiPanelOpen" />
    </header>

    <!-- 主体内容 -->
    <div class="app-body">
      <!-- 左侧边栏 -->
      <Sidebar />

      <!-- 中间 WebView -->
      <main class="main-content">
        <BrowserView @navigate="onNavigate" />
      </main>

      <!-- 右侧 AI 面板 -->
      <aside v-if="aiPanelOpen" class="ai-panel">
        <AIChatPanel :currentUrl="currentUrl" :currentTitle="currentTitle" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--bg-primary);
}

.app-header {
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  gap: 12px;
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.app-logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
}

.app-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.ai-panel {
  width: 360px;
  flex-shrink: 0;
  border-left: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
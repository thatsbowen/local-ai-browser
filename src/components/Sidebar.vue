<script setup lang="ts">
import { ref, onMounted } from 'vue'

type Tab = 'bookmarks' | 'history'
const activeTab = ref<Tab>('bookmarks')

interface Bookmark {
  id: number
  title: string
  url: string
  folder: string
  createdAt: string
}

interface HistoryItem {
  id: number
  title: string
  url: string
  visitedAt: string
}

const bookmarks = ref<Bookmark[]>([])
const history = ref<HistoryItem[]>([])

const loadBookmarks = async () => {
  try {
    bookmarks.value = await window.electronAPI.bookmark.getAll()
  } catch (e) {
    console.error('加载收藏失败', e)
  }
}

const loadHistory = async () => {
  try {
    history.value = await window.electronAPI.history.getAll(200)
  } catch (e) {
    console.error('加载历史失败', e)
  }
}

const addBookmark = async () => {
  const title = prompt('输入收藏标题:')
  if (!title) return
  const url = prompt('输入收藏网址:')
  if (!url) return
  await window.electronAPI.bookmark.add({ title, url })
  await loadBookmarks()
}

const removeBookmark = async (id: number) => {
  await window.electronAPI.bookmark.remove(id)
  await loadBookmarks()
}

const navigateTo = (url: string) => {
  window.dispatchEvent(new CustomEvent('browser-navigate', { detail: { url } }))
}

onMounted(() => {
  loadBookmarks()
  loadHistory()
})
</script>

<template>
  <aside class="sidebar">
    <!-- 标签切换 -->
    <div class="sidebar-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'bookmarks' }"
        @click="activeTab = 'bookmarks'"
      >
        ⭐ 收藏
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'history' }"
        @click="activeTab = 'history'; loadHistory()"
      >
        🕐 历史
      </button>
    </div>

    <!-- 收藏夹 -->
    <div v-if="activeTab === 'bookmarks'" class="sidebar-content">
      <div class="sidebar-header">
        <span class="sidebar-title">我的收藏</span>
        <button class="add-btn" @click="addBookmark" title="添加收藏">+</button>
      </div>
      <div class="item-list">
        <div
          v-for="bm in bookmarks"
          :key="bm.id"
          class="item"
          @click="navigateTo(bm.url)"
        >
          <div class="item-title">{{ bm.title }}</div>
          <div class="item-url">{{ bm.url }}</div>
          <button class="delete-btn" @click.stop="removeBookmark(bm.id)">✕</button>
        </div>
        <div v-if="bookmarks.length === 0" class="empty-state">
          暂无收藏<br/>点击 + 添加
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div v-if="activeTab === 'history'" class="sidebar-content">
      <div class="sidebar-header">
        <span class="sidebar-title">浏览历史</span>
        <button class="add-btn" @click="loadHistory()">↻</button>
      </div>
      <div class="item-list">
        <div
          v-for="item in history"
          :key="item.id"
          class="item"
          @click="navigateTo(item.url)"
        >
          <div class="item-title">{{ item.title }}</div>
          <div class="item-url">{{ item.url }}</div>
        </div>
        <div v-if="history.length === 0" class="empty-state">
          暂无历史记录
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 12px 8px;
  background: transparent;
  font-size: 13px;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: var(--accent-blue);
  border-bottom-color: var(--accent-blue);
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.add-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--accent-blue);
  color: white;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.item {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  position: relative;
  margin-bottom: 2px;
}

.item:hover {
  background: var(--bg-tertiary);
}

.item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 20px;
}

.item-url {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
}

.item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: var(--danger);
  color: white;
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.8;
}
</style>
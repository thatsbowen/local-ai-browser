<script setup lang="ts">
import { ref, onMounted } from 'vue'

const url = ref('')
const loading = ref(false)

const emit = defineEmits<{
  navigate: [url: string, title: string]
}>()

const navigate = () => {
  let address = url.value.trim()
  if (!address) return

  // 自动补充协议
  if (!/^https?:\/\//i.test(address)) {
    // 如果不是 URL，当作搜索引擎处理
    if (!address.includes('.')) {
      address = `https://www.bing.com/search?q=${encodeURIComponent(address)}`
    } else {
      address = 'https://' + address
    }
  }

  emit('navigate', address, address)
  url.value = address
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    navigate()
  }
}
</script>

<template>
  <div class="address-bar">
    <button class="nav-btn" title="后退" disabled>&#8592;</button>
    <button class="nav-btn" title="前进" disabled>&#8594;</button>
    <button class="nav-btn" title="刷新" @click="$emit('navigate', url, '')">&#8635;</button>

    <div class="url-input-wrapper">
      <span class="lock-icon">🔒</span>
      <input
        v-model="url"
        class="url-input"
        placeholder="输入网址或搜索内容..."
        @keydown="handleKeydown"
      />
    </div>

    <button class="go-btn" @click="navigate">转到</button>
  </div>
</template>

<style scoped>
.address-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  -webkit-app-region: no-drag;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.url-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-tertiary);
  border: 1.5px solid var(--border-color);
  border-radius: 20px;
  padding: 0 12px;
  gap: 6px;
  height: 36px;
}

.url-input-wrapper:focus-within {
  border-color: var(--accent-blue);
  background: var(--bg-secondary);
}

.lock-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.url-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  padding: 0;
  width: 100%;
}

.url-input::placeholder {
  color: var(--text-muted);
}

.go-btn {
  padding: 6px 16px;
  background: var(--accent-blue);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.go-btn:hover {
  background: var(--accent-blue-hover);
}
</style>
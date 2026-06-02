<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{ navigate: [url: string, title: string] }>()

const webviewRef = ref<HTMLWebViewElement | null>(null)
const currentUrl = ref('')
const currentTitle = ref('')
const loading = ref(false)

onMounted(() => {
  // 监听浏览器导航事件
  window.addEventListener('browser-navigate', ((e: CustomEvent) => {
    const url = e.detail.url as string
    if (webviewRef.value) {
      webviewRef.value.src = url
    }
  }) as EventListener)

  if (webviewRef.value) {
    webviewRef.value.addEventListener('did-navigate', (e: any) => {
      currentUrl.value = e.url || ''
      loading.value = false
    })
    webviewRef.value.addEventListener('page-title-updated', (e: any) => {
      currentTitle.value = e.detail?.title || ''
    })
    webviewRef.value.addEventListener('did-start-loading', () => {
      loading.value = true
    })
    webviewRef.value.addEventListener('did-stop-loading', () => {
      loading.value = false
    })
  }
})
</script>

<template>
  <div class="browser-view">
    <webview
      ref="webviewRef"
      src="https://www.bing.com"
      class="webview"
      allowpopups
    ></webview>
  </div>
</template>

<style scoped>
.browser-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.webview {
  flex: 1;
  width: 100%;
  border: none;
}
</style>
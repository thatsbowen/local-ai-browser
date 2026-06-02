<script setup lang="ts">
defineProps<{ active: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <button class="ai-btn" :class="{ active }" @click="emit('toggle')" title="AI 助手">
    <span class="ai-icon">✨</span>
    <span class="ai-text">AI</span>
  </button>
</template>

<style scoped>
.ai-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  background: var(--bg-tertiary);
  border: 1.5px solid var(--border-color);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  -webkit-app-region: no-drag;
}

.ai-btn:hover {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
  background: rgba(74, 144, 226, 0.06);
}

.ai-btn.active {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: white;
}

.ai-icon {
  font-size: 14px;
}

.ai-text {
  font-size: 13px;
}
</style>
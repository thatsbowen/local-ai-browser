<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import AIButton from './AIButton.vue'

const props = defineProps<{
  currentUrl: string
  currentTitle: string
}>()

type Tab = 'chat' | 'settings'
const activeTab = ref<Tab>('chat')
const inputMessage = ref('')
const chatMessages = ref<{ role: 'user' | 'ai'; content: string }[]>([])
const isLoading = ref(false)

// 模型配置
interface AIModel {
  id?: number
  name: string
  endpoint: string
  apiKey: string
  enabled?: boolean
  isDefault?: boolean
}

const models = ref<AIModel[]>([])
const selectedModelId = ref<number | null>(null)
const showAddModel = ref(false)
const newModel = ref<AIModel>({ name: '', endpoint: '', apiKey: '' })

// MCP 工具定义
const MCP_TOOLS = {
  open_urls: {
    name: 'open_urls',
    description: '在浏览器新标签中打开多个URL',
    params: { urls: { type: 'string[]', description: 'URL数组' } }
  },
  summarize_page: {
    name: 'summarize_page',
    description: '总结当前页面内容',
    params: { content: { type: 'string', description: '页面内容' } }
  },
  add_bookmark: {
    name: 'add_bookmark',
    description: '将页面添加到收藏夹',
    params: { title: { type: 'string' }, url: { type: 'string' } }
  },
  list_bookmarks: {
    name: 'list_bookmarks',
    description: '列出所有收藏'
  },
  list_history: {
    name: 'list_history',
    description: '列出浏览历史'
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    const el = document.getElementById('chat-messages')
    if (el) el.scrollTop = el.scrollHeight
  })
}

const loadModels = async () => {
  try {
    const result = await window.electronAPI.ai.getModels()
    models.value = result
    const defaultModel = result.find((m: any) => m.isDefault)
    if (defaultModel) selectedModelId.value = defaultModel.id
  } catch (e) {
    console.error('加载模型失败', e)
  }
}

const getSelectedModel = (): AIModel | null => {
  if (selectedModelId.value) {
    return models.value.find(m => m.id === selectedModelId.value) || null
  }
  return models.value[0] || null
}

const callAI = async (messages: { role: string; content: string }[]) => {
  const model = getSelectedModel()
  if (!model) {
    chatMessages.value.push({
      role: 'ai',
      content: '⚠️ 请先在设置中添加并选择 AI 模型'
    })
    return
  }

  isLoading.value = true
  try {
    const response = await fetch(`${model.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify({
        model: model.name,
        messages: messages,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`API 错误: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '（无回复）'
  } catch (err: any) {
    return `❌ 调用失败: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

// 解析 MCP 工具调用
const parseAndExecuteTool = async (content: string): Promise<string> => {
  // 检测工具调用模式 [TOOL:tool_name:params_json]
  const toolPattern = /\[TOOL:(\w+):([^\]]+)\]/g
  let match
  let resultParts: string[] = []
  let textParts: string[] = []
  let lastIndex = 0

  while ((match = toolPattern.exec(content)) !== null) {
    // 先把工具调用之前的文本加上
    if (match.index > lastIndex) {
      textParts.push(content.slice(lastIndex, match.index))
    }
    lastIndex = toolPattern.lastIndex

    const toolName = match[1]
    const paramsStr = match[2]
    let params: any = {}

    try {
      params = JSON.parse(paramsStr)
    } catch {
      params = {}
    }

    try {
      switch (toolName) {
        case 'open_urls': {
          const urls: string[] = Array.isArray(params.urls) ? params.urls : []
          if (urls.length === 0) {
            resultParts.push('⚠️ 未提供要打开的URL')
          } else {
            await window.electronAPI.browser.openUrls(urls)
            resultParts.push(`✅ 已打开 ${urls.length} 个链接`)
          }
          break
        }
        case 'add_bookmark': {
          if (params.title && params.url) {
            await window.electronAPI.bookmark.add({ title: params.title, url: params.url })
            resultParts.push(`✅ 已收藏: ${params.title}`)
          } else {
            resultParts.push('⚠️ 缺少 title 或 url 参数')
          }
          break
        }
        case 'list_bookmarks': {
          const bms = await window.electronAPI.bookmark.getAll()
          if (bms.length === 0) {
            resultParts.push('📂 收藏夹为空')
          } else {
            resultParts.push('📂 收藏夹内容:\n' + bms.map((b: any) => `• ${b.title} (${b.url})`).join('\n'))
          }
          break
        }
        case 'list_history': {
          const hist = await window.electronAPI.history.getAll(20)
          if (hist.length === 0) {
            resultParts.push('🕐 历史记录为空')
          } else {
            resultParts.push('🕐 最近浏览:\n' + hist.map((h: any) => `• ${h.title}`).join('\n'))
          }
          break
        }
        default:
          resultParts.push(`⚠️ 未知工具: ${toolName}`)
      }
    } catch (err: any) {
      resultParts.push(`❌ 执行 ${toolName} 失败: ${err.message}`)
    }
  }

  if (match) toolPattern.lastIndex = 0
  return resultParts.length > 0 ? resultParts.join('\n') : content
}

const buildSystemPrompt = () => {
  return `你是本地AI智能浏览器的AI助手。你通过浏览器内核渲染页面，可以通过MCP工具控制浏览器。

可用工具:
1. open_urls(urls: string[]) - 在浏览器新标签打开多个URL
2. add_bookmark(title: string, url: string) - 收藏当前页面
3. list_bookmarks() - 查看收藏夹
4. list_history() - 查看浏览历史
5. summarize_page(content: string) - 总结页面内容

当用户请求打开多个链接时，回复格式: [TOOL:open_urls:{"urls":["url1","url2"]}]
当用户请求收藏页面时，回复格式: [TOOL:add_bookmark:{"title":"标题","url":"网址"}]
当用户请求查看收藏，回复格式: [TOOL:list_bookmarks:{}]
当用户请求查看历史，回复格式: [TOOL:list_history:{}]

当前页面: ${props.currentTitle || '(无标题)'} - ${props.currentUrl || '(无URL)'}`
}

const sendMessage = async () => {
  const msg = inputMessage.value.trim()
  if (!msg || isLoading.value) return

  inputMessage.value = ''
  chatMessages.value.push({ role: 'user', content: msg })
  scrollToBottom()

  const systemMsg = { role: 'system', content: buildSystemPrompt() }
  const historyMsgs = chatMessages.value.map(m => ({ role: m.role, content: m.content }))
  const allMessages = [systemMsg, ...historyMsgs]

  const aiResponse = await callAI(allMessages)
  const processedResponse = await parseAndExecuteTool(aiResponse || '')

  chatMessages.value.push({ role: 'ai', content: processedResponse })
  scrollToBottom()
}

const saveModel = async () => {
  if (!newModel.value.name || !newModel.value.endpoint || !newModel.value.apiKey) return
  await window.electronAPI.ai.saveModel(newModel.value)
  newModel.value = { name: '', endpoint: '', apiKey: '' }
  showAddModel.value = false
  await loadModels()
}

const deleteModel = async (id: number) => {
  await window.electronAPI.ai.deleteModel(id)
  if (selectedModelId.value === id) selectedModelId.value = null
  await loadModels()
}

const setDefault = async (id: number) => {
  await window.electronAPI.ai.setDefault(id)
  selectedModelId.value = id
  await loadModels()
}

onMounted(() => {
  loadModels()
})
</script>

<template>
  <div class="ai-chat-panel">
    <!-- 顶部标签 -->
    <div class="panel-tabs">
      <button class="tab" :class="{ active: activeTab === 'chat' }" @click="activeTab = 'chat'">
        💬 AI 对话
      </button>
      <button class="tab" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'; loadModels()">
        ⚙️ 模型设置
      </button>
    </div>

    <!-- 聊天界面 -->
    <div v-if="activeTab === 'chat'" class="chat-area">
      <div id="chat-messages" class="messages">
        <div class="welcome-message">
          <div class="welcome-icon">✨</div>
          <div class="welcome-title">本地AI智能浏览器</div>
          <div class="welcome-desc">你可以用自然语言控制浏览器，例如：</div>
          <ul class="welcome-tips">
            <li>「打开这个页面的所有链接」</li>
            <li>「总结这个页面」</li>
            <li>「收藏这个页面」</li>
            <li>「打开收藏夹」</li>
            <li>「查看浏览历史」</li>
          </ul>
        </div>

        <template v-for="(msg, i) in chatMessages" :key="i">
          <div class="message" :class="msg.role">
            <div class="message-role">{{ msg.role === 'user' ? '你' : 'AI' }}</div>
            <div class="message-content">{{ msg.content }}</div>
          </div>
        </template>

        <div v-if="isLoading" class="message ai">
          <div class="message-role">AI</div>
          <div class="message-content loading">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>

      <div class="input-area">
        <input
          v-model="inputMessage"
          class="chat-input"
          placeholder="输入 AI 指令..."
          @keydown.enter="sendMessage"
          :disabled="isLoading"
        />
        <button class="send-btn" @click="sendMessage" :disabled="isLoading || !inputMessage.trim()">
          {{ isLoading ? '...' : '发送' }}
        </button>
      </div>
    </div>

    <!-- 模型设置界面 -->
    <div v-if="activeTab === 'settings'" class="settings-area">
      <div class="settings-header">
        <span>AI 模型配置</span>
        <button class="add-model-btn" @click="showAddModel = !showAddModel">
          {{ showAddModel ? '取消' : '+ 添加模型' }}
        </button>
      </div>

      <!-- 添加模型表单 -->
      <div v-if="showAddModel" class="model-form">
        <input v-model="newModel.name" placeholder="模型名称（如 deepseek-chat）" />
        <input v-model="newModel.endpoint" placeholder="API 端点 URL" />
        <input v-model="newModel.apiKey" type="password" placeholder="API Key" />
        <button class="save-model-btn" @click="saveModel">保存模型</button>
      </div>

      <!-- 模型列表 -->
      <div class="model-list">
        <div v-if="models.length === 0 && !showAddModel" class="empty-models">
          暂未配置模型，请点击「添加模型」配置
        </div>
        <div v-for="model in models" :key="model.id" class="model-item">
          <div class="model-info">
            <div class="model-name">
              {{ model.name }}
              <span v-if="model.isDefault" class="default-badge">默认</span>
            </div>
            <div class="model-endpoint">{{ model.endpoint }}</div>
          </div>
          <div class="model-actions">
            <button v-if="!model.isDefault" class="model-action-btn" @click="setDefault(model.id!)">设为默认</button>
            <button class="model-action-btn danger" @click="deleteModel(model.id!)">删除</button>
          </div>
        </div>
      </div>

      <!-- 模型配置说明 -->
      <div class="model-help">
        <div class="help-title">模型配置说明</div>
        <div class="help-item"><strong>MiniMax:</strong> 端点 https://api.minimax.chat/v1</div>
        <div class="help-item"><strong>DeepSeek:</strong> 端点 https://api.deepseek.com/v1</div>
        <div class="help-item"><strong>Qwen:</strong> 端点 https://dashscope.aliyuncs.com/v1</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.tab {
  flex: 1;
  padding: 14px 8px;
  background: transparent;
  font-size: 13px;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab.active {
  color: var(--accent-blue);
  border-bottom-color: var(--accent-blue);
}

/* Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.welcome-message {
  text-align: center;
  padding: 24px 16px;
  color: var(--text-muted);
}

.welcome-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.welcome-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.welcome-desc {
  font-size: 13px;
  margin-bottom: 12px;
}

.welcome-tips {
  text-align: left;
  font-size: 13px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.welcome-tips li {
  background: var(--bg-tertiary);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.message {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message.user {
  align-items: flex-end;
}

.message.ai {
  align-items: flex-start;
}

.message-role {
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 4px;
}

.message-content {
  background: var(--bg-tertiary);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 280px;
}

.message.user .message-content {
  background: var(--accent-blue);
  color: white;
}

.message-content.loading {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 10px 16px;
}

.message-content.loading .dot {
  width: 6px;
  height: 6px;
  background: var(--text-muted);
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}

.message-content.loading .dot:nth-child(2) { animation-delay: 0.2s; }
.message-content.loading .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

.input-area {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  height: 38px;
  border-radius: 19px;
  padding: 0 16px;
  font-size: 13px;
}

.send-btn {
  width: 60px;
  height: 38px;
  border-radius: 19px;
  background: var(--accent-blue);
  color: white;
  font-size: 13px;
  font-weight: 500;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Settings Area */
.settings-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}

.add-model-btn {
  font-size: 13px;
  color: var(--accent-blue);
  background: transparent;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.add-model-btn:hover {
  background: rgba(74, 144, 226, 0.08);
}

.model-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-tertiary);
  padding: 12px;
  border-radius: var(--radius-md);
}

.model-form input {
  font-size: 13px;
}

.save-model-btn {
  padding: 8px;
  background: var(--accent-blue);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-models {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 13px;
}

.model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  gap: 8px;
}

.model-info {
  flex: 1;
  min-width: 0;
}

.model-name {
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.default-badge {
  font-size: 10px;
  background: var(--success);
  color: white;
  padding: 1px 5px;
  border-radius: 3px;
}

.model-endpoint {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.model-action-btn {
  padding: 3px 8px;
  border-radius: 4px;
  background: transparent;
  font-size: 11px;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.model-action-btn:hover {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.model-action-btn.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.model-help {
  margin-top: 8px;
  padding: 12px;
  background: rgba(74, 144, 226, 0.06);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.help-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--accent-blue);
}

.help-item {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
</style>
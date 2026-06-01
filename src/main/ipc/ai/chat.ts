import { getStore } from '../../store/config'
import { logger } from '../../utils/logger'

export interface ChatParams {
  chatId: string
  message: string
  systemPrompt?: string
}

type ChunkCallback = (chunk: string) => void

// 预设提供商配置
const PRESET_PROVIDERS: Record<string, {
  name: string
  baseURL: string
  models: string[]
  apiFormat: 'openai' | 'anthropic'
}> = {
  zhipu: {
    name: '智谱 GLM-4',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-flash', 'glm-4-plus', 'glm-4-0520', 'glm-4-airx'],
    apiFormat: 'openai'
  },
  aliyun: {
    name: '阿里 Qwen',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-coder-turbo'],
    apiFormat: 'openai'
  },
  tencent: {
    name: '腾讯 混元',
    baseURL: 'https://api.hunyuan.cloud.tencent.com/v1',
    models: ['hunyuan-turbo', 'hunyuan-pro'],
    apiFormat: 'openai'
  },
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
    apiFormat: 'openai'
  }
}

export const getProviderInfo = (provider: string) => {
  return PRESET_PROVIDERS[provider] || null
}

export const getAllProviders = () => {
  return PRESET_PROVIDERS
}

export const chatWithAI = async (
  params: ChatParams,
  onChunk?: ChunkCallback
): Promise<string> => {
  const store = getStore()
  const aiConfig = store.get('aiConfig')

  const { provider, apiKey, baseURL, model, customProviders, systemPrompt } = aiConfig

  let requestBody: any
  let headers: Record<string, string>
  let url: string

  // 确定使用哪个配置
  if (provider === 'custom') {
    // 自定义provider
    const custom = customProviders.find((c: any) => c.id === 'current') || customProviders[0]
    if (!custom) throw new Error('请先配置自定义API')

    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custom.apiKey}`
    }
    url = `${custom.baseURL}/chat/completions`
    requestBody = {
      model: custom.model,
      messages: buildMessages(params.message, systemPrompt),
      stream: true
    }
  } else {
    const preset = PRESET_PROVIDERS[provider]
    if (!preset) throw new Error(`未知提供商: ${provider}`)

    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
    url = `${preset.baseURL}/chat/completions`
    requestBody = {
      model: model || preset.models[0],
      messages: buildMessages(params.message, systemPrompt),
      stream: true
    }
  }

  // 发起请求
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API请求失败 (${response.status}): ${errorText}`)
  }

  // 处理流式响应
  const reader = response.body?.getReader()
  if (!reader) throw new Error('无法读取响应流')

  const decoder = new TextDecoder()
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content || ''
          if (content) {
            fullContent += content
            onChunk?.(content)
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }

  return fullContent
}

function buildMessages(userMessage: string, systemPrompt?: string) {
  const messages: Array<{ role: string; content: string }> = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: userMessage })
  return messages
}

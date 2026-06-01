import { useState, useEffect } from 'react'
import type { AIConfig } from '../../types'
import AILogo from './AILogo'

const PRESET_PROVIDERS = [
  { id: 'zhipu', name: '智谱 GLM-4', models: ['glm-4-flash', 'glm-4-plus', 'glm-4-airx'] },
  { id: 'aliyun', name: '阿里 Qwen', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'] },
  { id: 'tencent', name: '腾讯 混元', models: ['hunyuan-turbo', 'hunyuan-pro'] },
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
  { id: 'custom', name: '自定义', models: [] }
]

interface AIModelConfigProps {
  onClose: () => void
}

export default function AIModelConfig({ onClose }: AIModelConfigProps) {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'zhipu',
    apiKey: '',
    baseURL: '',
    model: 'glm-4-flash',
    customProviders: [],
    systemPrompt: ''
  })
  const [saving, setSaving] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customForm, setCustomForm] = useState({
    name: '',
    apiKey: '',
    baseURL: '',
    model: '',
    apiFormat: 'openai' as 'openai' | 'anthropic'
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const saved = await window.electronAPI?.ai?.getConfig()
      if (saved) setConfig({ ...config, ...saved })
    } catch (err) {
      console.error('Failed to load AI config:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.electronAPI?.ai?.setConfig(config)
      onClose()
    } catch (err) {
      console.error('Failed to save AI config:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleProviderChange = (providerId: string) => {
    setConfig(prev => ({
      ...prev,
      provider: providerId,
      model: PRESET_PROVIDERS.find(p => p.id === providerId)?.models[0] || ''
    }))
    setShowCustomForm(providerId === 'custom')
  }

  const addCustomProvider = () => {
    if (!customForm.name || !customForm.apiKey || !customForm.baseURL || !customForm.model) {
      alert('请填写完整的自定义配置')
      return
    }
    const newProvider = {
      id: `custom_${Date.now()}`,
      ...customForm
    }
    setConfig(prev => ({
      ...prev,
      customProviders: [...prev.customProviders, newProvider]
    }))
    setShowCustomForm(false)
    setCustomForm({ name: '', apiKey: '', baseURL: '', model: '', apiFormat: 'openai' })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <AILogo size={40} />
        <div>
          <h3 className="text-lg font-semibold text-white">AI 模型配置</h3>
          <p className="text-xs text-gray-400">配置您的大模型API</p>
        </div>
      </div>

      {/* 选择提供商 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">选择提供商</label>
        <div className="grid grid-cols-1 gap-2">
          {PRESET_PROVIDERS.map(provider => (
            <button
              key={provider.id}
              onClick={() => handleProviderChange(provider.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                config.provider === provider.id
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-border bg-dark hover:border-gray-500 text-gray-300'
              }`}
            >
              <div className="font-medium">{provider.name}</div>
              {provider.models.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  模型: {provider.models.join(', ')}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* API Key 输入 */}
      {config.provider !== 'custom' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">API Key</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            placeholder="输入您的API Key"
            className="w-full px-3 py-2 bg-dark border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {/* 模型选择 */}
      {config.provider !== 'custom' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">选择模型</label>
          <select
            value={config.model}
            onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
            className="w-full px-3 py-2 bg-dark border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary"
          >
            {(PRESET_PROVIDERS.find(p => p.id === config.provider)?.models || []).map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      )}

      {/* 自定义配置表单 */}
      {showCustomForm && (
        <div className="space-y-4 p-4 bg-dark rounded-lg border border-border">
          <h4 className="font-medium text-white">自定义 API 配置</h4>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">配置名称</label>
            <input
              type="text"
              value={customForm.name}
              onChange={e => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如：我的自定义模型"
              className="w-full px-3 py-2 bg-dark-lighter border border-border rounded text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">API 地址</label>
            <input
              type="text"
              value={customForm.baseURL}
              onChange={e => setCustomForm(prev => ({ ...prev, baseURL: e.target.value }))}
              placeholder="https://api.example.com/v1"
              className="w-full px-3 py-2 bg-dark-lighter border border-border rounded text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">API Key</label>
            <input
              type="password"
              value={customForm.apiKey}
              onChange={e => setCustomForm(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-dark-lighter border border-border rounded text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">模型名称</label>
            <input
              type="text"
              value={customForm.model}
              onChange={e => setCustomForm(prev => ({ ...prev, model: e.target.value }))}
              placeholder="gpt-4, claude-3, etc."
              className="w-full px-3 py-2 bg-dark-lighter border border-border rounded text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">API 格式</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="radio"
                  checked={customForm.apiFormat === 'openai'}
                  onChange={() => setCustomForm(prev => ({ ...prev, apiFormat: 'openai' }))}
                  className="accent-primary"
                />
                OpenAI 兼容
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="radio"
                  checked={customForm.apiFormat === 'anthropic'}
                  onChange={() => setCustomForm(prev => ({ ...prev, apiFormat: 'anthropic' }))}
                  className="accent-primary"
                />
                Anthropic 兼容
              </label>
            </div>
          </div>

          <button
            onClick={addCustomProvider}
            className="w-full py-2 bg-primary hover:bg-primary-dark rounded-lg text-white text-sm font-medium transition-colors"
          >
            添加自定义配置
          </button>
        </div>
      )}

      {/* 系统提示词 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">系统提示词（可选）</label>
        <textarea
          value={config.systemPrompt}
          onChange={e => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
          placeholder="设置AI助手的角色和行为，例如：你是一个有用的助手..."
          rows={4}
          className="w-full px-3 py-2 bg-dark border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary resize-none"
        />
      </div>

      {/* 保存按钮 */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 border border-border rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 bg-primary hover:bg-primary-dark rounded-lg text-white font-medium transition-colors disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  )
}

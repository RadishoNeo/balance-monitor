// 插件加载器 - 用于静态导入所有插件
// 由于 Electron 的动态导入限制，我们使用静态导入
// 未来可以改为动态导入以实现真正的插件化

import { ParserPlugin } from './plugin-interface'
import { PARSER_STRATEGIES } from '../parser-types'

// 导入所有插件
import { DeepSeekPlugin } from './plugins/deepseek'
import { MoonshotPlugin } from './plugins/moonshot'
import { AIHubMixPlugin } from './plugins/aihubmix'
import { OpenRouterPlugin } from './plugins/openrouter'
import { VolcEnginePlugin } from './plugins/volcengine'
import { PPIOPlugin } from './plugins/ppio'

// 插件注册表
const pluginRegistry: Record<string, () => ParserPlugin> = {
  [PARSER_STRATEGIES.DEEPSEEK]: () => new DeepSeekPlugin(),
  [PARSER_STRATEGIES.MOONSHOT]: () => new MoonshotPlugin(),
  [PARSER_STRATEGIES.AIHUBMIX]: () => new AIHubMixPlugin(),
  [PARSER_STRATEGIES.OPENROUTER]: () => new OpenRouterPlugin(),
  [PARSER_STRATEGIES.VOLCENGINE]: () => new VolcEnginePlugin(),
  [PARSER_STRATEGIES.PPIO]: () => new PPIOPlugin()
}

// 获取所有插件实例
export function getAllPlugins(): ParserPlugin[] {
  return Object.values(pluginRegistry).map((creator) => creator())
}

// 根据ID获取插件
export function getPluginById(id: string): ParserPlugin | undefined {
  const creator = pluginRegistry[id]
  return creator ? creator() : undefined
}

// 获取插件ID列表
export function getPluginIds(): string[] {
  return Object.keys(pluginRegistry)
}

// 检查插件是否存在
export function hasPlugin(id: string): boolean {
  return id in pluginRegistry
}

// 动态注册插件（运行时添加新插件）
export function registerPlugin(id: string, pluginCreator: () => ParserPlugin): void {
  if (pluginRegistry[id]) {
    console.warn(`[PluginLoader] 插件 ${id} 已存在，将被覆盖`)
  }
  pluginRegistry[id] = pluginCreator
  console.log(`[PluginLoader] 注册插件: ${id}`)
}

// 移除插件
export function unregisterPlugin(id: string): boolean {
  if (pluginRegistry[id]) {
    delete pluginRegistry[id]
    console.log(`[PluginLoader] 移除插件: ${id}`)
    return true
  }
  return false
}

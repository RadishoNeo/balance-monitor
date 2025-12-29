# 版本 1.1.1 更新说明

发布日期：2025-12-30

## 概述

本次更新主要优化了UI界面，改进了logo显示逻辑，并清理了冗余文档文件，提升了用户体验和代码质量。

## 主要变更

### UI优化与改进

- **Logo显示逻辑优化**: 统一从balance.ts配置文件中获取logo资源
  - 在ConfigManager组件中：使用`balanceList.find()`动态获取对应配置的logo
  - 在StatusPanel组件中：统一logo获取逻辑，确保一致性
  - 改进logo容器的样式设计，添加渐变背景和悬停效果

- **ConfigManager组件UI增强**:
  - 添加渐变背景：`bg-gradient-to-br from-primary/10 via-primary/5 to-transparent`
  - 添加光泽效果：悬停时显示`bg-gradient-to-tr from-white/20 to-transparent`
  - 添加悬停动画：logo缩放效果`group-hover:scale-110`
  - 改进边框和阴影效果，提升视觉层次感

- **StatusPanel组件UI优化**:
  - 为logo容器添加背景和边框：`bg-background/40 border border-border/30`
  - 添加毛玻璃效果：`backdrop-blur-sm`
  - 添加悬停动画：`group-hover:scale-105`
  - 改进logo显示区域，提升整体美观度

### 代码重构与清理

- **资源导入优化**: 将balance.ts中的logo路径改为import语句
  - 从相对路径改为import导入：`import deepseekLogo from '../assets/providers/deepseek.png'`
  - 支持所有厂商logo：DeepSeek、Moonshot、欧派云、AIHubMix、OpenRouter、VolcEngine
  - 提高构建时的资源处理效率

- **冗余文件清理**: 删除`src/renderer/src/config/balance.md`文档文件
  - 该文件包含各厂商API文档，已不再需要
  - 减少项目体积，简化代码结构
  - 避免维护多个地方的相同信息

### 技术改进

- **样式一致性**: 统一两个组件中的logo获取逻辑
- **动画效果**: 添加平滑的悬停过渡动画，提升用户体验
- **代码复用**: 通过balanceList配置集中管理logo资源
- **构建优化**: 使用import语句导入图片资源，提高构建效率

## 兼容性说明

- **完全向后兼容**: 所有现有功能保持兼容
- **配置兼容**: 配置文件格式和存储方式保持不变
- **API兼容**: IPC接口和类型定义保持不变

## 迁移指南

本次更新无需特殊迁移步骤，所有更改将自动生效。

### 开发者注意事项

1. **添加新厂商**: 在balance.ts中添加新配置时，需要同时添加对应的logo import
2. **样式定制**: 新的渐变和动画效果可通过TailwindCSS类名进行定制
3. **资源管理**: 所有图片资源应通过import语句导入，而不是使用相对路径

## 已知问题

无

## 后续计划

1. 继续优化UI动画和交互效果
2. 添加更多厂商支持
3. 改进监控服务的性能和稳定性

---

**版本**: 1.1.1
**发布日期**: 2025-12-30
**上一个版本**: 1.1.0
**下一个版本**: 计划中
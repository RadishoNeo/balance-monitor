# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Balance Monitor** desktop application built with Electron, React, and TypeScript. The application monitors balance data from API endpoints at scheduled intervals, parses the responses, and displays updates via system tray notifications and a UI dashboard.

## Tech Stack

- **Electron**: v39.2.6 for desktop app framework
- **React**: v19.2.1 for UI components
- **TypeScript**: v5.9.3 for type safety
- **Build Tool**: electron-vite v5.0.0
- **Styling**: TailwindCSS v4.1.18
- **Package Manager**: npm

## Architecture

### Three-Process Architecture

1. **Main Process** (`src/main/`): Core application logic, system tray, scheduling, IPC handlers
2. **Preload Script** (`src/preload/`): Secure bridge between main and renderer processes
3. **Renderer Process** (`src/renderer/`): React UI, user interactions

### Key Modules

**Main Process Modules:**

- `index.ts`: Entry point, window creation, service initialization
- `config-manager.ts`: Configuration CRUD operations (create/update/delete/active configs)
- `monitor-scheduler.ts`: Scheduled monitoring execution, timer management
- `api-engine.ts`: HTTP API request execution and testing
- `balance-parser.ts`: Response parsing with XPath support
- `logger.ts`: Structured logging system with log rotation
- `tray-manager.ts`: System tray icon and context menu

**Renderer Process Modules:**

- React hooks in `src/renderer/src/hooks/`: Custom hooks for Electron API (`useElectronAPI`, `useBalanceMonitor`, `useConfigManager`)
- Components in `src/renderer/src/components/`: UI components for configuration, monitoring, and testing

## Development Commands

```bash
# Install dependencies
npm install

# Development (starts both Vite dev server and Electron)
npm run dev

# Type checking
npm run typecheck:node  # Main process types
npm run typecheck:web   # Renderer process types
npm run typecheck       # Check both

# Code quality
npm run lint           # ESLint check
npm run format         # Prettier format

# Building
npm run build          # Build for current platform
npm run build:win      # Windows installer
tnpm run build:mac     # macOS package
npm run build:linux    # Linux packages
```

## Project Structure

```
src/
├── main/           # Main process (Node.js)
│   ├── index.ts    # App entry, window creation, IPC setup
│   ├── config-manager.ts  # Configuration storage and management
│   ├── monitor-scheduler.ts  # Timer-based monitoring executor
│   ├── api-engine.ts    # HTTP request handling
│   ├── balance-parser.ts  # Response data parsing
│   ├── logger.ts        # Application logging
│   └── tray-manager.ts  # System tray integration
├── preload/        # Preload script (bridge)
│   ├── index.ts    # Exposed APIs to renderer
│   └── index.d.ts  # Type definitions
└── renderer/       # Renderer process (React)
    ├── index.html  # HTML template
    ├── src/
    │   ├── main.tsx      # React app entry
    │   ├── App.tsx       # Main app component
    │   ├── components/   # React components
    │   ├── hooks/        # Custom React hooks
    │   └── types/        # TypeScript types
```

## Configuration Storage

- **Location**: `C:\Users\{USER}\.balance-monitor\` (Windows) or `~/.balance-monitor/` (macOS/Linux)
- **File Format**: Single encrypted JSON file (`configs.enc.json`) containing all configurations
- **Active Config**: Tracked in `active.json` within config directory
- **Auto-backup**: Enabled by default, stores in `backups/` directory

## IPC Communication Pattern

**Main → Renderer (Events):**

- `balance-update`: New balance data from API
- `status-change`: Monitor status changes
- `app-ready`: App initialization complete
- `navigate-to-config`: Navigate to config UI from tray

**Renderer → Main (IPC Handles):**

- Config management: `save-config`, `load-config`, `delete-config`, etc.
- Testing: `test-api-connection`, `test-parser`
- Logs: `get-logs`, `clear-logs`
- Window control: `minimize-window`, `close-window`

## Testing/Debugging

- **DevTools**: F12 during development mode
- **Logs**: Logger stores rotating logs accessible via `get-logs` IPC
- **Configuration Testing**: Built-in test connection feature in UI
- **Parser Testing**: Test balance parsing with sample data

## Build & Distribution

- **Build Config**: `electron-builder.yml`
- **Output**: Platform-specific installers in `build/` directory
- **App ID**: `com.electron.app`
- **Auto-updates**: Configured but URL not set (default in config)

## Key Dependencies

- `@electron-toolkit/utils`: Electron utilities and optimization
- `@electron-toolkit/preload`: Preload script helpers
- `electron-vite`: Vite-based build tool for Electron
- React 19 with hooks for state management
- TailwindCSS for utility-first styling

## 更新记录与Changelog

### 更新记录规范

每次版本更新时，必须按照以下规范记录更新内容：

#### 1. 文件命名规范
- **发布说明文件**: `doc/changelog/release-notes-v{版本号}.md` (例如: `doc/changelog/release-notes-v1.0.4.md`)
- **Changelog文件**: `doc/changelog/CHANGELOG.md` (主文件，包含所有版本历史)

#### 2. 版本号规范
遵循语义化版本控制 (SemVer):
- **主版本号 (MAJOR)**: 不兼容的API修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正

#### 3. 更新内容分类
每次更新应按以下类别组织内容：

**功能新增 (Features):**
- 新功能、新模块
- 用户界面改进
- 性能优化

**问题修复 (Bug Fixes):**
- 错误修复
- 稳定性改进
- 安全修复

**代码质量 (Code Quality):**
- 重构代码
- 代码格式化
- 类型定义改进
- 文档更新

**依赖更新 (Dependencies):**
- 依赖包升级
- 构建工具更新

#### 4. 提交信息规范
Git提交信息应遵循以下格式：
```
类型(范围): 简短描述

详细描述（可选）

- 变更点1
- 变更点2

关联Issue: #123

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**类型说明:**
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 5. 更新流程
1. **开发阶段**: 按规范编写提交信息
2. **版本发布前**: 创建`doc/changelog/release-notes-v{版本号}.md`文件
3. **版本发布**: 更新`doc/changelog/CHANGELOG.md`文件
4. **版本号更新**: 更新`package.json`中的版本号
5. **提交**: 提交所有更改并推送到远程仓库

### 6. 文件模板
参见项目中的`doc/changelog/release-notes-v1.0.4.md`和`doc/changelog/CHANGELOG.md`文件作为参考模板。

### 7. 自动化建议
考虑使用以下工具自动化Changelog生成：
- `standard-version`: 自动生成CHANGELOG和版本管理
- `conventional-changelog`: 基于约定式提交生成CHANGELOG
- GitHub Actions: 自动化发布流程

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

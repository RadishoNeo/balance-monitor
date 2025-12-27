# Balance Monitor

A cross-platform desktop application for monitoring balance data from API endpoints. Built with Electron, React, and TypeScript.

![Electron](https://img.shields.io/badge/Electron-39.2.6-47848F?logo=electron)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## Features

- 🔍 **API Monitoring**: Schedule and monitor balance data from any HTTP API endpoint
- 📊 **Smart Parsing**: XPath-based response extraction with JSON path support
- 🔔 **System Tray**: Background monitoring with tray notifications for balance changes
- ⚙️ **Multi-Configuration**: Support for multiple API configurations and easy switching
- 🎯 **Real-time Testing**: Built-in API connection testing and parser validation
- 📋 **Log Management**: Comprehensive logging system with viewer interface
- 🖥️ **Cross-Platform**: Works on Windows, macOS, and Linux

## Tech Stack

- **Framework**: Electron 39.2.6 with electron-vite
- **Frontend**: React 19.2.1 with TypeScript
- **Styling**: TailwindCSS 4.1.18
- **Build Tool**: electron-vite 5.0.0
- **Package Manager**: npm

## Project Structure

```
├── src/
│   ├── main/           # Electron main process (Node.js)
│   │   ├── index.ts           # App entry point
│   │   ├── config-manager.ts  # Configuration management
│   │   ├── monitor-scheduler.ts # Scheduled monitoring
│   │   ├── api-engine.ts      # HTTP API requests
│   │   ├── balance-parser.ts  # Response parsing
│   │   ├── logger.ts          # Application logging
│   │   └── tray-manager.ts    # System tray integration
│   ├── preload/        # Preload script (IPC bridge)
│   └── renderer/       # React frontend
│       ├── src/
│       │   ├── components/    # React UI components
│       │   ├── hooks/         # Custom React hooks
│       │   └── types/         # TypeScript type definitions
├── .github/workflows/  # CI/CD configuration
└── resources/          # Static assets
```

## Development

### Prerequisites

- Node.js 20+
- npm
- Windows, macOS, or Linux

### Installation

```bash
# Clone the repository
git clone https://github.com/cherry-min/balance-monitor.git
cd balance-monitor

# Install dependencies
npm install
```

### Development Mode

```bash
# Start development server (with hot-reload)
npm run dev
```

### Code Quality

```bash
# Type checking
npm run typecheck      # Check both main and renderer process types

# Linting
npm run lint           # Run ESLint

# Formatting
npm run format         # Format code with Prettier
```

### Testing

Use the built-in testing features in the application UI:

- **Test API Connection**: Validate endpoint connectivity
- **Test Parser**: Verify data extraction with sample responses

## Building

### Platform-specific Builds

```bash
# Build for Windows (creates installer)
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux (multiple formats)
npm run build:linux

# Build unpacked version (for development/debugging)
npm run build:unpack
```

### All-in-One Build

```bash
# Full build with type checking
npm run build
```

Build outputs are located in the `dist/` directory.

## CI/CD

This project includes GitHub Actions workflow (`.github/workflows/build.yml`) that automatically builds and releases for all platforms when pushing to the `master` branch.

## Configuration

Configurations are stored in:

- **Windows**: `C:\Users\{USER}\AppData\Roaming\my-app\configs\`
- **Linux/macOS**: `~/.config/my-app/configs/`

Features:

- Multiple configuration support
- Active configuration switching
- Import/export functionality
- Automatic backups

## IPC Communication

**Main → Renderer:**

- `balance-update`: Balance data updates
- `status-change`: Monitor status changes
- `app-ready`: App initialization

**Renderer → Main:**

- Configuration management (CRUD operations)
- API testing and validation
- Log retrieval and management
- Window control

## Recommended IDE Setup

- **[VSCode](https://code.visualstudio.com/)** with extensions:
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  - [TypeScript Hero](https://marketplace.visualstudio.com/items?itemName=rbbit.typescript-hero)
  - [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

**Cherry** - [GitHub Profile](https://github.com/cherry-min)

**Project Homepage**: https://github.com/cherry-min/balance-monitor

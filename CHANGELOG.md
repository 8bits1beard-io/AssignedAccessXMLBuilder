# Changelog

All notable changes to Kiosk Overseer are documented here.

## [1.2.8] - 2026-01-23

### Removed
- `--allow-file-access-from-files` browser argument (ineffective when Edge URLBlocklist policy blocks file:// URLs)

## [1.2.6] - 2026-01-23

### Changed
- Configuration summary now downloads as `README.md` for repository storage
- Removed Start, Taskbar, and Edge Tile buttons from allowed apps list (use Step 3/4 instead)

### Added
- Island Browser support with kiosk mode detection and presets

### Fixed
- Consolidated modular architecture: moved actionHandlers to config.js for correct function references
- Removed ~1300 lines of duplicate functions from app.js

## [1.1.2] - 2026-01-21

### Fixed
- Secondary tile pins (Edge URLs) no longer cause "missing name or target path" error in PowerShell scripts

## [1.1.1] - 2026-01-21

### Fixed
- Print Spooler preset now correctly opens Print Queue (was pointing to spoolsv.exe service)

## [1.1.0] - 2026-01-21

### Added
- Kiosk mode support for Chrome, Firefox, and Brave browsers
- Brave browser added to common app presets
- Author field with automatic date in configuration metadata

### Changed
- Refactored codebase into modules (apps.js, pins.js, config.js)
- Unified Start menu and Taskbar pin management to reduce code duplication
- Renamed "Edge Options" to "Kiosk Mode" for browser-agnostic labeling
- Removed redundant "Use Allowed App" dropdown from pin edit panels
- Improved "System Shortcut Path" field with better labeling and placeholder

### Fixed
- Content Security Policy updated to allow Cloudflare Insights

## [1.0.0] - Initial Release

### Added
- Single-App, Multi-App, and Restricted User kiosk modes
- Microsoft Edge kiosk configuration (URL and local file sources)
- UWP and Win32 application support
- Start menu and taskbar pin management with drag-and-drop reordering
- AssignedAccess XML generation with all namespaces (2017-2022)
- PowerShell deployment script with pre-flight checks and logging
- Shortcut creator script for Intune deployments
- Start Layout XML export
- Configuration import/export (`.kioskoverseer.json`)
- Real-time validation with detailed error messages
- 40+ common app presets (Office, browsers, system tools)
- Breakout sequence configuration for technician access
- Auto-launch app configuration
- File Explorer access restrictions
- Fallout and Fluent UI themes
- Self-hosted fonts and Content Security Policy

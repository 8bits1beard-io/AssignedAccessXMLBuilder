# Changelog

All notable changes to Kiosk Overseer are documented here.

## [1.4.4] - 2026-01-28

### Added
- Copy button feedback: "Copy GUID" and "Copy XML" buttons now show "Copied!" with green highlight for 1.5 seconds
- Improved empty state messages with actionable guidance (e.g., "No apps added yet. Use 'Add Common App' above to get started.")
- XML preview accessibility: added `aria-readonly="true"` and improved aria-label

### Changed
- Theme toggle moved from header to footer for less prominent but more discoverable placement
- Removed alert dialog after copying XML (replaced with inline button feedback)

## [1.4.3] - 2026-01-27

### Removed
- Desktop wallpaper configuration (solid color and image path) — use Intune OMA-URI policy instead

## [1.4.1] - 2026-01-27

### Fixed
- Wallpaper not applying to kiosk user: replaced registry hive writes with Active Setup so wallpaper is set in the correct user context at logon
- KioskOverseer Sentry not relaunching Edge: browser child processes fooled the simple process check; now uses `MainWindowHandle` filter for browsers
- KioskOverseer Sentry generalized to support any Win32 app, not just browsers

### Added
- Diagnostic event log enablement: deployment script now enables Assigned Access, AppLocker, and AppXDeployment log channels for troubleshooting blocked apps
- Privacy section in README confirming all processing is client-side with no data collection

### Changed
- KioskOverseer Sentry moved from standalone Setup tab section into the auto-launch area of the Allowed Apps step
- KioskOverseer Sentry renamed from "Browser Watchdog" to "KioskOverseer Sentry" throughout (UI, PowerShell task, logs)
- Wallpaper deployment uses Active Setup (`HKLM\...\Active Setup\Installed Components`) instead of direct registry hive manipulation
- XML preview simplified: removed syntax coloring, section highlighting, and color legend
- PowerShell task renamed from `KioskOverseer-BrowserWatchdog` to `KioskOverseer-Sentry`

## [1.3.4] - 2026-01-27

### Fixed
- Configuration Summary now correctly identifies Restricted User mode (was always showing "Multi-App")
- Account section now documents User Group and Global Profile account types
- Auto-launch browser detection now covers Chrome, Firefox, Brave, and Island (was Edge-only)

### Added
- Taskbar Pins section in Configuration Summary
- Desktop Wallpaper section in Configuration Summary (solid color or image path)
- KioskOverseer Sentry section in Configuration Summary (process name, poll interval, task name)
- App type labels (Win32/UWP) in allowed applications list
- Edge source type (URL vs Local File) shown in browser settings
- Code-formatted paths and GUIDs for readability
- Generator attribution footer

### Changed
- "Whitelisted Applications" renamed to "Allowed Applications"
- System Restrictions now rendered as a table for clarity
- Start Menu Pins and Taskbar Pins sections only appear when pins are configured
- Breakout Sequence section simplified (removed redundant "Enabled: Yes")

## [1.3.3] - 2026-01-27

### Fixed
- Dark theme text contrast improved (`#3FAF72` → `#57C484`) to meet WCAG 2.1 AA 4.5:1 ratio
- Added `role="switch"` to all toggle switch inputs for correct screen reader semantics
- Tab buttons now expose `aria-disabled` state for assistive technology
- Collapsible section headers now toggle `aria-expanded` for screen readers
- Pin action button `aria-label` attributes now use `escapeAttr()` to prevent XSS from user input
- XML legend color swatches now use distinct border patterns (solid/dashed/dotted/double) for color-blind accessibility

## [1.3.2] - 2026-01-27

### Added
- Desktop wallpaper configuration for multi-app and restricted kiosk modes (solid color or image path)
- KioskOverseer Sentry feature: optional scheduled task that monitors and relaunches the auto-launch app if closed (e.g., by Intune idle timeout policy)
- Color picker input styling for wallpaper configuration

### Changed
- PowerShell deployment script now includes wallpaper registry configuration and KioskOverseer Sentry scheduled task creation when enabled

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

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kiosk Overseer is a web-based GUI for building Windows 11 Assigned Access (kiosk) configurations. It generates validated AssignedAccess XML without hand-editing, supports visual app/pin configuration, and exports deployment-ready scripts.

**Target:** Windows 11 Pro/Enterprise/Education only (uses v4/v5 XML namespaces not available in Windows 10).

## Development Commands

```bash
# Start local server (required - fetch() won't work with file:// URLs)
python -m http.server 8080

# Then open http://localhost:8080
```

No build step, no npm, no framework. Pure vanilla JavaScript served statically.

## Architecture

### Script Loading Order

Scripts load in this order in `index.html`. **Order matters** - later scripts can override functions from earlier ones:

1. `dom.js` - DOM element caching
2. `state.js` - Central state object, preset loading
3. `helpers.js` - Utilities (clipboard, download, browser detection)
4. `xml.js` - AssignedAccess XML generation
5. `validation.js` - Input validation rules
6. `app.js` - Core logic, event handlers, UI management
7. `apps.js` - Allowed apps management (overrides app.js duplicates)
8. `pins.js` - Unified pin management for Start menu and Taskbar
9. `config.js` - Save/load/import/export functionality

### Module Responsibilities

| File | Purpose |
|------|---------|
| `app.js` | Core logic: event delegation, kiosk mode switching, Edge args UI, export generation |
| `apps.js` | Allowed apps CRUD: addAllowedApp, removeApp, renderAppList, auto-launch selection |
| `pins.js` | Unified pin management using `PIN_LIST_CONFIG` to handle both Start and Taskbar pins |
| `config.js` | Configuration persistence: buildConfigSnapshot, applyConfigSnapshot, XML import/export |
| `xml.js` | AssignedAccess XML generation with proper namespace handling (rs5, v3, v4, v5) |
| `validation.js` | Input validation rules, returns error objects with field and message |
| `helpers.js` | Utilities: clipboard, file download, XML escaping, browser detection |
| `state.js` | Central `state` object and async preset loading from JSON files |
| `dom.js` | DOM element caching via `dom.get(id)` to avoid repeated queries |

### Unified Pin Management

`pins.js` uses a configuration-driven approach to eliminate duplication between Start menu and Taskbar pins:

```javascript
const PIN_LIST_CONFIG = {
    start: { stateKey: 'startPins', listId: 'pinList', ... },
    taskbar: { stateKey: 'taskbarPins', listId: 'taskbarPinList', ... }
};
```

Functions like `renderPinListForType(listType)` use this config to handle both pin types with shared logic.

### Key State Structure

```javascript
state = {
    mode: 'single' | 'multi' | 'restricted',
    accountType: 'auto' | 'existing' | 'group' | 'global',
    allowedApps: [{type: 'path'|'aumid', value: string, skipAutoPin?, skipAutoLaunch?}],
    startPins: [{name, target, args, iconPath, pinType, systemShortcut, packagedAppId, tileId}],
    taskbarPins: [...],
    autoLaunchApp: null | index,
    multiAppEdgeConfig: {url, sourceType, kioskType}
}
```

### Event Delegation Pattern

HTML uses `data-action` and `data-arg` attributes. Single delegated listener in `app.js` dispatches to handler functions based on action name.

### Browser Kiosk Support

`helpers.js` provides browser detection functions:
- `isEdgeApp()`, `isChromeApp()`, `isFirefoxApp()`, `isBraveApp()`
- `isBrowserWithKioskSupport()` - combines all four

Kiosk args vary by browser:
- **Edge**: Full options (fullscreen/public-browsing, idle timeout)
- **Chrome/Brave**: `--kiosk URL --no-first-run`
- **Firefox**: `--kiosk URL`

### XML Namespace Versions

- `2017/config` - Base kiosk
- `201901/config` (rs5) - DisplayName, AutoLaunch
- `2020/config` (v3) - AllowRemovableDrives, GlobalProfile
- `2021/config` (v4) - ClassicAppPath (Win32 in single-app), BreakoutSequence
- `2022/config` (v5) - StartPins (Windows 11 Start menu)

## Coding Conventions

- **Functions:** camelCase, verb-first (`updatePreview`, `renderPinList`)
- **DOM IDs:** camelCase (`fileExplorerAccess`)
- **Data attributes:** kebab-case (`data-action`, `data-change`)
- **CSS classes:** kebab-case (`.pin-item`)
- **Indentation:** 4 spaces

## Version Bumps - CRITICAL REQUIREMENT

**MANDATORY: After ANY change to HTML, CSS, or JS files, you MUST update ALL version numbers in `index.html`.**

This is NOT optional. Browser caching will break the application if versions are not updated.

### When to Update Versions

Update versions after changes to:
- HTML structure (`index.html` itself)
- Any JavaScript file (`*.js`)
- CSS files (`styles.css`)

### How to Update Versions

**ALWAYS update ALL of these together** - never update just one:

1. **Header build version** (displays to user):
```html
KIOSK OVERSEER // BUILD X.X.X
```

2. **All file version query strings**:
```html
<link rel="stylesheet" href="styles.css?v=X.X.X">
...
<script src="dom.js?v=X.X.X"></script>
<script src="state.js?v=X.X.X"></script>
<script src="helpers.js?v=X.X.X"></script>
<script src="xml.js?v=X.X.X"></script>
<script src="validation.js?v=X.X.X"></script>
<script src="app.js?v=X.X.X"></script>
<script src="apps.js?v=X.X.X"></script>
<script src="pins.js?v=X.X.X"></script>
<script src="config.js?v=X.X.X"></script>
```

Increment the patch version (e.g., `1.1.2` → `1.1.3`) for all locations in sync.

**Example:** If you modify only `app.js` and `index.html`, you still update ALL 11 version locations (1 header + 10 file query strings) from `1.1.2` to `1.1.3`.

## Data Files

- `data/app-presets.json` - Common Windows app definitions with groups for multi-path apps
- `data/pin-presets.json` - Start menu pin templates

App preset structure:
```json
{
    "apps": {
        "edge": { "type": "path", "value": "...\\msedge.exe" },
        "edgeProxy": { "type": "path", "value": "...", "skipAutoPin": true }
    },
    "groups": {
        "edge": ["edge", "edgeProxy", "edgeAppId"]
    }
}
```

## Testing

Manual testing only (no automated test framework):

1. Test all three kiosk modes (Single-App, Multi-App, Restricted User)
2. Test browser kiosk options (Edge, Chrome, Firefox, Brave)
3. Test pin management (add, edit, reorder, duplicate, remove)
4. Test all exports (XML, PowerShell, shortcuts, config save/load)
5. Test XML import functionality

## Edge Kiosk Notes

Edge Chromium is Win32, not UWP. Use `%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe` with ClassicAppPath/DesktopAppPath.

For Edge secondary tiles in StartPins, include all three in allowed apps:
- `msedge.exe`
- `msedge_proxy.exe`
- `Microsoft.MicrosoftEdge.Stable_8wekyb3d8bbwe!App`

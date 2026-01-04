# Kiosk Overseer (Windows Kiosk Builder)

Build Windows Assigned Access (kiosk) XML without hand-editing. Configure modes, apps, pins, and export validated XML in minutes.

**Hosted app:** https://mksa.pages.dev

## Quick Start

- **Use hosted app:** open https://mksa.pages.dev
- **Run locally:**
  - `python -m http.server`
  - open `http://localhost:8000`
- **Workflow:** choose kiosk mode → add apps → configure pins (if multi/restricted) → export XML

## Core Features

- Single-App, Multi-App, and Restricted User kiosk modes
- Edge kiosk (URL or local file), UWP, and Win32 apps
- Start menu pins, taskbar pins, and Edge site tiles
- Auto-launch configuration and validation
- Export: XML, PowerShell deploy script, Start Layout XML, shortcut creator
- Import/export configuration files (`.kioskoverseer.json`)

## Project Structure

- `index.html` entry point, `styles.css` for UI and themes
- `app.js` main logic; helpers in `helpers.js`, `dom.js`
- XML generation in `xml.js`, validation in `validation.js`, summary in `summary.js`
- Presets in `data/`, sample configs in `configs/`
- Assets in `assets/`

## Requirements

- **Windows:** 11 Pro, Enterprise, or Education
- **Browser:** Any modern browser (Edge, Chrome, Firefox)
- **Deployment:** Intune (OMA-URI), PowerShell, or PPKG

## Development Notes

The app loads presets via `fetch()`, so it must be served from a local web server (not opened as a `file://`).

## Documentation

- **Deployment, troubleshooting, and deep reference:** see `REFERENCE.md`
- **Contributor guidance:** see `AGENTS.md`

## License

See `LICENSE`.

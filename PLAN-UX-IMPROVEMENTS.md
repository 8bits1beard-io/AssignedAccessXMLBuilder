# UX Improvement Plan — KioskOverseer v1.5.0

## Overview

This plan addresses 11 concrete UX improvements identified through analysis of the current codebase. Changes are grouped into 4 phases ordered by dependency and impact. Each item includes affected files, scope, and implementation notes.

**Current version:** 1.4.8
**Target version:** 1.5.0 (bump after all phases complete)

---

## Phase 1: Fix What's Broken + Quick Schema Win

Low-effort, high-impact changes that fix existing bugs and close a trivial schema gap.

### 1A. Render the Progress Rail (Bug Fix)

**Problem:** `updateProgressRail()` exists in app.js (line 909), CSS exists in styles.css (line 1832), but the HTML element is completely missing from index.html. The function silently returns because `document.querySelector('.progress-rail')` finds nothing.

**Files:** `index.html`

**Implementation:**
- Add a `.progress-rail` element inside the config panel, between the `.tab-nav` area and the `.tab-panels` container (after line 53 in index.html, inside the config `.panel`)
- Structure:

```html
<div class="progress-rail" role="navigation" aria-label="Configuration progress">
    <div class="progress-step" data-step="setup">
        <div class="progress-label">Setup</div>
    </div>
    <div class="progress-step" data-step="apps">
        <div class="progress-label">Apps</div>
    </div>
    <div class="progress-step" data-step="pins">
        <div class="progress-label">Pins</div>
    </div>
    <div class="progress-step" data-step="export">
        <div class="progress-label">Export</div>
    </div>
</div>
```

- No JS changes needed — `updateProgressRail()` already queries for these exact `data-step` values and applies `.complete`, `.ready`, `.optional`, `.current` classes
- No CSS changes needed — styles already exist for all states
- The "pins" step auto-hides in single-app mode (already handled in JS line 925)

**Verification:** Switch between modes and tabs. Confirm steps light up as complete/ready/current. Confirm "pins" step hides in single-app mode.

---

### 1B. Add `Profile/@Name` Attribute to XML

**Problem:** The MS schema supports an optional `Name` attribute on `<Profile>`. KioskOverseer has a `configName` field but only uses it for filenames — it never appears in the XML output.

**Files:** `xml.js`

**Implementation:**
- In `generateXml()` (xml.js line 16), change:
  ```javascript
  xml += `        <Profile Id="${profileId}">\n`;
  ```
  to:
  ```javascript
  const profileName = escapeAttr(dom.get('configName').value.trim());
  xml += profileName
      ? `        <Profile Id="${profileId}" Name="${profileName}">\n`
      : `        <Profile Id="${profileId}">\n`;
  ```
- Only emits `Name` when configName is non-empty (keeps XML clean for unnamed configs)

**Verification:** Set a config name, generate XML, confirm `Name="..."` appears on the Profile element. Leave name blank, confirm attribute is absent.

---

### 1C. Expose Hidden Presets in UI

**Problem:** `loadPreset()` in config.js supports 4 presets (`blank`, `edgeFullscreen`, `edgePublic`, `multiApp`) but only `blank` has a button in the header ("New"). The other 3 are unreachable.

**Files:** `index.html`

**Implementation:**
- Add a "Load Example" dropdown or button group in the header command strip (after the "New" button, line 21):

```html
<select data-action="loadPreset" data-change="true" aria-label="Load example configuration" class="btn-secondary" style="min-width: 140px;">
    <option value="" disabled selected>Load Example...</option>
    <option value="edgeFullscreen">Edge Fullscreen Kiosk</option>
    <option value="edgePublic">Edge Public Browsing</option>
    <option value="multiApp">Multi-App Kiosk</option>
</select>
```

- Need to handle `<select>` in the event delegation. Currently `actionHandlers` only fires on `click`. The select needs a `change` event. Check if `data-change` is already handled in the event listener at the bottom of config.js — if not, add a `change` listener that reads `e.target.value` and calls `loadPreset(value)`, then resets the select.

**Verification:** Select each example from the dropdown. Confirm state, form fields, and XML preview all update correctly. Confirm the select resets to "Load Example..." after selection.

---

## Phase 2: Validation & Feedback

Improve how the app communicates errors and status to users.

### 2A. Real-Time Field Validation on Blur

**Problem:** Validation only runs at export time. Users fill out the entire form, click "Download XML", and get a list of errors with no indication of which tab or field is wrong.

**Files:** `validation.js`, `app.js`, `styles.css`

**Implementation:**

1. **Add a `data-required` attribute** to required fields in index.html:
   - `configName` — always required
   - `profileId` — always required
   - `displayName` — required when accountType === 'auto'
   - `accountName` — required when accountType === 'existing'
   - `groupName` — required when accountType === 'group'
   - `edgeUrl` — required when mode=single, appType=edge, sourceType=url
   - `uwpAumid` — required when mode=single, appType=uwp
   - `win32Path` — required when mode=single, appType=win32

2. **Add a `validateField(fieldId)` function** in validation.js that checks a single field and returns an error string or null. This reuses the same rules as `validate()` but for one field at a time.

3. **Add blur event listeners** in app.js `initEventListeners()` (or wherever the DOMContentLoaded setup runs):
   ```javascript
   document.querySelectorAll('[data-required]').forEach(input => {
       input.addEventListener('blur', () => {
           const error = validateField(input.id);
           const errorEl = input.parentElement.querySelector('.field-error');
           if (error) {
               input.classList.add('invalid');
               if (!errorEl) {
                   const span = document.createElement('span');
                   span.className = 'field-error';
                   span.textContent = error;
                   input.parentElement.appendChild(span);
               } else {
                   errorEl.textContent = error;
               }
           } else {
               input.classList.remove('invalid');
               if (errorEl) errorEl.remove();
           }
       });
   });
   ```

4. **Add CSS** for `.field-error`:
   ```css
   .field-error {
       display: block;
       font-size: 0.8rem;
       color: var(--error);
       margin-top: 4px;
   }
   ```

   The `input.invalid` style already exists in styles.css (line 1577).

**Verification:** Leave configName blank, tab away — red border + error message appears. Fill it in, tab away — error clears. Repeat for profileId, displayName, etc.

---

### 2B. Tab Validation Indicators

**Problem:** Users don't know which tab has errors until they read the validation summary on the Export tab.

**Files:** `app.js`, `styles.css`

**Implementation:**

1. **Add a `updateTabIndicators()` function** in app.js that runs after `updateProgressRail()`:
   ```javascript
   function updateTabIndicators() {
       const errors = validate();
       const tabErrors = {
           setup: errors.some(e => e.includes('Configuration Name') || e.includes('Profile GUID') || e.includes('Display Name') || e.includes('Account') || e.includes('Group') || e.includes('URL') || e.includes('AUMID') || e.includes('path')),
           application: errors.some(e => e.includes('allowed app')),
           startmenu: errors.some(e => e.includes('pin') || e.includes('shortcut')),
           taskbar: false,
           summary: false
       };
       Object.entries(tabErrors).forEach(([tab, hasError]) => {
           const btn = dom.get(`tab-btn-${tab}`);
           if (btn) btn.classList.toggle('tab-has-errors', hasError);
       });
   }
   ```

   Note: This is a rough heuristic. A better approach would be to have `validate()` return error objects with a `tab` field (e.g. `{ message: '...', tab: 'setup' }`). This is a larger refactor of validation.js but would be cleaner. Decide at implementation time whether to do the quick heuristic or the proper refactor.

2. **Add CSS** for the error indicator:
   ```css
   .side-nav-btn.tab-has-errors::after {
       content: "";
       display: inline-block;
       width: 6px;
       height: 6px;
       border-radius: 50%;
       background: var(--error);
       margin-left: 8px;
       vertical-align: middle;
   }
   ```

3. **Call `updateTabIndicators()`** from `updatePreview()` (alongside the existing `updateProgressRail()` call).

**Verification:** Leave required fields blank, switch to another tab — the Setup tab shows a red dot. Fill in the fields — dot disappears.

---

### 2C. Pre-Export Validation Checklist on Summary Tab

**Problem:** The `#validationStatus` div only shows errors. Users have no positive feedback about what's correctly configured.

**Files:** `app.js` (in `updatePreview()` or `showValidation()`)

**Implementation:**

- Enhance `showValidation()` in validation.js (or create a new `showValidationChecklist()` in app.js) that populates `#validationStatus` with both successes and errors:

```javascript
function showValidationChecklist() {
    const el = dom.get('validationStatus');
    if (!el) return;

    const checks = [
        {
            label: 'Profile GUID',
            ok: /^\{[0-9a-fA-F]{8}-/.test(dom.get('profileId').value)
        },
        {
            label: 'Account configured',
            ok: (state.accountType === 'auto' && dom.get('displayName').value.trim()) ||
                (state.accountType === 'existing' && dom.get('accountName').value.trim()) ||
                (state.accountType === 'group' && dom.get('groupName').value.trim()) ||
                state.accountType === 'global'
        },
        {
            label: 'App configured',
            ok: state.mode === 'single'
                ? dom.get('appType').value && (/* appropriate field filled */)
                : state.allowedApps.length > 0
        },
        {
            label: 'Start pins',
            ok: state.mode === 'single' || state.startPins.length > 0,
            optional: true
        }
    ];

    const html = checks.map(c => {
        const icon = c.ok ? '<span style="color:var(--success)">OK</span>' : (c.optional ? '<span style="color:var(--warning)">--</span>' : '<span style="color:var(--error)">!!</span>');
        return `<div>${icon} ${c.label}</div>`;
    }).join('');

    el.innerHTML = html;
}
```

- Call from `updatePreview()` so it stays current.

**Verification:** Open the Summary tab with a partially complete config. Confirm green checks for completed items and red indicators for missing items.

---

## Phase 3: UX Polish

Improve the day-to-day experience of using the tool.

### 3A. Searchable Common Apps

**Problem:** 31 buttons across 5 categories. Users scan all of them to find one app.

**Files:** `index.html`, `apps.js` (or `app.js`)

**Implementation:**

1. **Add a search input** above the common apps section in index.html (before line 495):
   ```html
   <div class="form-group" style="margin-bottom: 8px;">
       <input type="search" id="commonAppSearch" placeholder="Filter apps..." class="btn-small" style="width: 100%;" data-config-skip="true">
   </div>
   ```

2. **Add filter logic** in apps.js:
   ```javascript
   function filterCommonApps() {
       const query = dom.get('commonAppSearch').value.toLowerCase();
       document.querySelectorAll('[data-action="addCommonApp"]').forEach(btn => {
           const match = btn.textContent.toLowerCase().includes(query);
           btn.style.display = match ? '' : 'none';
       });
       // Also hide empty category labels
       document.querySelectorAll('.common-app-category').forEach(cat => {
           const hasVisible = cat.querySelectorAll('[data-action="addCommonApp"]:not([style*="display: none"])').length > 0;
           cat.style.display = hasVisible ? '' : 'none';
       });
   }
   ```

3. **Wrap each category row** in a container with class `common-app-category` for the filter to target.

4. **Attach listener**: `dom.get('commonAppSearch').addEventListener('input', filterCommonApps);` in the init section.

**Verification:** Type "edge" — only Edge button visible. Type "calc" — only Calculator visible. Clear input — all buttons return.

---

### 3B. Sticky Sidebar Navigation

**Problem:** On long pages, the sidebar scrolls off-screen and users lose track of which tab they're on.

**Files:** `styles.css`

**Implementation:**
- Add to existing `.side-nav` rule (styles.css line 424):
  ```css
  .side-nav {
      position: sticky;
      top: 24px;
      align-self: start;
  }
  ```
- Only apply on desktop (already inside the default grid layout which breaks at 1200px, where sidebar becomes horizontal — sticky won't matter there).

**Verification:** Scroll down in the config panel on a desktop viewport. Confirm sidebar stays visible and anchored to the top.

---

### 3C. Collapse Optional Pin Fields

**Problem:** The pin "Add Shortcut" form shows 6 fields immediately (Name, Target, Args, Working Dir, Icon Path, Edge Args). Most pins only need Name + Target.

**Files:** `index.html`, `styles.css`

**Implementation:**

1. **Wrap optional fields** (Arguments, Working Directory, Icon Path) in a collapsible container:
   ```html
   <details class="pin-advanced-options">
       <summary class="btn-secondary btn-small">Advanced Options</summary>
       <div class="pin-advanced-body">
           <!-- Args, Working Dir, Icon Path fields -->
       </div>
   </details>
   ```

2. **Apply to both** the Start Menu pin form (lines ~690-700) and the Taskbar pin form (lines ~940-950).

3. **CSS:**
   ```css
   .pin-advanced-options {
       margin-top: 8px;
   }
   .pin-advanced-options summary {
       cursor: pointer;
       list-style: none;
       font-size: 0.85rem;
       color: var(--text-secondary);
   }
   .pin-advanced-body {
       padding-top: 10px;
       display: flex;
       flex-direction: column;
       gap: 10px;
   }
   ```

4. **Auto-open when needed**: If the Edge args group becomes visible (target is a browser), auto-open the `<details>` element:
   ```javascript
   // In updateEdgeArgsVisibility or similar:
   const details = container.closest('details.pin-advanced-options');
   if (details && shouldShow) details.open = true;
   ```

**Verification:** Add a new pin — only Name and Target fields visible. Click "Advanced Options" — Args, Working Dir, Icon Path appear. Enter an Edge path as target — Advanced Options auto-opens to show Edge kiosk config.

---

### 3D. Guided Export Flow on Summary Tab

**Problem:** Users see 5 export buttons and don't know which to use for their deployment scenario.

**Files:** `index.html`, `styles.css`, `app.js` or `config.js`

**Implementation:**

1. **Replace the flat export grid** with a deployment-method selector above the buttons:
   ```html
   <div class="sub-panel export-panel">
       <div class="sub-panel-title">EXPORT</div>
       <div class="export-method-selector" role="group" aria-label="Deployment method">
           <button type="button" class="btn-secondary btn-small export-method active" data-method="intune">Intune / MDM</button>
           <button type="button" class="btn-secondary btn-small export-method" data-method="local">Local / Script</button>
           <button type="button" class="btn-secondary btn-small export-method" data-method="ppkg">Provisioning Pkg</button>
       </div>
       <div class="export-guidance" id="exportGuidance">
           <!-- Dynamic: shows recommended exports + brief instructions -->
       </div>
       <div class="export-grid" role="group" aria-label="Export options">
           <!-- Existing buttons, but now some get highlighted/dimmed based on method -->
       </div>
   </div>
   ```

2. **Add a `switchExportMethod(method)` function** that:
   - Highlights the primary export for that method (e.g. Intune = "Download XML" primary, Local = "All-In-One Script" primary)
   - Shows context-specific guidance text in `#exportGuidance`
   - Dims irrelevant buttons (e.g. "Manifest Override" is irrelevant for Intune)

3. **Guidance text per method:**
   - **Intune**: "Download the XML and paste it into an Intune OMA-URI custom policy. See Deploy Guide for full steps."
   - **Local**: "Download the All-In-One Script to apply the XML, create shortcuts, and configure the kiosk. Run as SYSTEM."
   - **PPKG**: "Download the XML and paste it into Windows Configuration Designer under AssignedAccess > AssignedAccessSettings."

4. **Register `switchExportMethod` in `actionHandlers`.**

**Verification:** Click "Intune" — Download XML is prominent, guidance shows Intune instructions. Click "Local" — All-In-One Script is prominent. Guidance updates.

---

## Phase 4: Structural Improvements

Larger refactors that reduce code duplication and improve maintainability.

### 4A. Consolidate Edge Kiosk Args Into Reusable Modal

**Problem:** The Edge kiosk args builder (mode selector, source type, URL/file, idle timeout, "Apply" button) is duplicated 4 times in index.html with near-identical HTML and 8+ near-identical JS functions.

**Current instances:**
| Location | Container ID | JS Functions |
|---|---|---|
| Add Start Pin | `pinEdgeArgsGroup` | `updatePinEdgeArgsModeUI`, `updatePinEdgeArgsSourceUI`, `applyEdgeArgsToPin` |
| Edit Start Pin | `editPinEdgeArgsGroup` | `updateEditPinEdgeArgsModeUI`, `updateEditPinEdgeArgsSourceUI`, `applyEdgeArgsToEditPin` |
| Add Taskbar Pin | `taskbarPinEdgeArgsGroup` | `updateTaskbarPinEdgeArgsModeUI`, `updateTaskbarPinEdgeArgsSourceUI`, `applyEdgeArgsToTaskbarPin` |
| Edit Taskbar Pin | `editTaskbarEdgeArgsGroup` | `updateEditTaskbarEdgeArgsModeUI`, `updateEditTaskbarEdgeArgsSourceUI`, `applyEdgeArgsToEditTaskbarPin` |

**Files:** `index.html`, `pins.js` (or `app.js`), `config.js`, `styles.css`

**Implementation:**

1. **Create a single modal** in index.html (after the deploy modal):
   ```html
   <div id="edgeArgsModal" class="modal hidden" role="dialog" aria-labelledby="edgeArgsModalTitle" aria-modal="true">
       <div class="modal-backdrop" data-action="hideEdgeArgsModal"></div>
       <div class="modal-content">
           <div class="modal-header">
               <h2 id="edgeArgsModalTitle">Configure Edge Kiosk Mode</h2>
               <button type="button" class="modal-close" data-action="hideEdgeArgsModal" aria-label="Close">&times;</button>
           </div>
           <div class="modal-body">
               <!-- Single copy of: mode selector, source type, URL, file path, idle timeout -->
               <div class="form-group">
                   <label for="edgeModalMode">Kiosk Mode</label>
                   <select id="edgeModalMode">
                       <option value="standard">Standard (no kiosk args)</option>
                       <option value="kioskFullscreen">Kiosk Fullscreen</option>
                       <option value="kioskPublic">Kiosk Public Browsing</option>
                   </select>
               </div>
               <!-- ... source type, URL, file path, idle timeout ... -->
               <button type="button" class="btn-primary" data-action="applyEdgeArgsModal">Apply</button>
           </div>
       </div>
   </div>
   ```

2. **Replace inline Edge args sections** with a single button in each pin form:
   ```html
   <button type="button" class="btn-secondary btn-small" data-action="openEdgeArgsModal" data-arg="pinArgs">Configure Kiosk Mode...</button>
   ```
   The `data-arg` tells the modal which field to write the result back to.

3. **Create 3 functions** in pins.js (or helpers.js):
   - `openEdgeArgsModal(targetFieldId)` — opens modal, reads current args from the target field, populates modal fields
   - `applyEdgeArgsModal()` — builds args string from modal fields, writes to the stored target field, closes modal
   - `hideEdgeArgsModal()` — closes modal

4. **Remove the 4 inline Edge args sections** from index.html (~120 lines removed).

5. **Remove the 8 duplicate JS functions** from pins.js and their entries from `actionHandlers` in config.js.

6. **Register new handlers**: `openEdgeArgsModal`, `applyEdgeArgsModal`, `hideEdgeArgsModal` in `actionHandlers`.

**Net result:** ~120 lines removed from HTML, ~80 lines removed from JS, replaced by ~60 lines of modal HTML + ~40 lines of JS. Total reduction: ~100 lines.

**Verification:** Open Add Start Pin form, enter an Edge path, click "Configure Kiosk Mode...", set fullscreen + URL, click Apply — confirm args field populated. Repeat for Edit Start Pin, Add Taskbar Pin, Edit Taskbar Pin.

---

### 4B. Refactor Validation to Return Structured Errors

**Problem:** `validate()` returns plain strings. This makes it impossible to map errors to specific tabs, fields, or severity levels.

**Files:** `validation.js`, `app.js`

**Implementation:**

1. **Change error format** from strings to objects:
   ```javascript
   // Before:
   errs.push('Configuration Name is required');

   // After:
   errs.push({
       message: 'Configuration Name is required',
       field: 'configName',
       tab: 'setup',
       severity: 'error' // or 'warning'
   });
   ```

2. **Update all consumers** of `validate()`:
   - `showValidation()` — map to `.message` for display
   - `getExportStatus()` — check `.length` (unchanged)
   - `updateTabIndicators()` — filter by `.tab`
   - Export functions — check `.severity === 'error'`

3. **Keep backward compatibility** during transition by having `showValidation()` extract `.message` from each error object.

**Verification:** Run exports, confirm error messages still display correctly. Confirm tab indicators use the `.tab` field to highlight the correct tab.

---

## Implementation Order

```
Phase 1 (v1.4.9)
  1A  Progress Rail HTML           ~15 min    index.html
  1B  Profile/@Name in XML         ~10 min    xml.js
  1C  Expose Preset Examples       ~20 min    index.html, config.js

Phase 2 (v1.4.10)
  2A  Real-Time Field Validation   ~45 min    validation.js, app.js, styles.css, index.html
  2B  Tab Validation Indicators    ~20 min    app.js, styles.css
  2C  Pre-Export Checklist         ~30 min    app.js

Phase 3 (v1.4.11)
  3A  Searchable Common Apps       ~20 min    index.html, apps.js
  3B  Sticky Sidebar               ~5 min     styles.css
  3C  Collapse Pin Optional Fields ~25 min    index.html, styles.css, pins.js
  3D  Guided Export Flow           ~40 min    index.html, styles.css, app.js, config.js

Phase 4 (v1.5.0)
  4A  Edge Args Modal              ~60 min    index.html, pins.js, config.js, styles.css
  4B  Structured Validation Errors ~40 min    validation.js, app.js
```

Each phase gets its own version bump. Final version after all phases: **1.5.0**.

---

## Files Changed Per Phase

| Phase | index.html | styles.css | app.js | validation.js | xml.js | config.js | apps.js | pins.js |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1     | X |   |   |   | X | X |   |   |
| 2     | X | X | X | X |   |   |   |   |
| 3     | X | X | X |   |   | X | X | X |
| 4     | X | X | X | X |   | X |   | X |

---

## Out of Scope (Future Consideration)

These were identified but deferred as larger efforts:

- **Mobile-first responsive redesign** — Major layout rework, deserves its own project
- **XML syntax highlighting** — Would require a library (Highlight.js) or custom tokenizer
- **Drag-and-drop pin reordering** — Up/down buttons work; drag adds complexity
- **Multi-profile/multi-config support** — Schema gap but significant architecture change
- **Onboarding wizard/modal** — Valuable but needs design work beyond code changes
- **Secondary tile icon fields** (smallIconPath, smallIcon, largeIconPath) — Niche feature
- **Accessibility contrast audit** — Needs careful testing against WCAG AA across both themes
- **i18n / localization** — All text is hardcoded English; significant effort to externalize

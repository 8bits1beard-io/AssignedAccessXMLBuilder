/* ============================================================================
   Preset Data (loaded from JSON files)
   ============================================================================ */
let appPresets = null;
let pinPresets = null;
let singleAppPresets = null;

async function loadPresets() {
    try {
        const [appResponse, pinResponse, singleAppResponse] = await Promise.all([
            fetch('data/app-presets.json'),
            fetch('data/pin-presets.json'),
            fetch('data/single-app-presets.json')
        ]);
        appPresets = await appResponse.json();
        pinPresets = await pinResponse.json();
        singleAppPresets = await singleAppResponse.json();
    } catch (e) {
        console.error('Failed to load presets:', e);
    }
}

/* ============================================================================
   State Management
   ============================================================================ */
const state = {
    mode: 'single',           // 'single', 'multi', or 'restricted'
    accountType: 'auto',      // 'auto', 'existing', 'group', or 'global'
    allowedApps: [],          // For multi-app and restricted modes
    startPins: [],            // For multi-app and restricted modes: array of {name, target, args, workingDir, iconPath}
    taskbarPins: [],          // For taskbar layout: array of {name, pinType, packagedAppId, systemShortcut}
    autoLaunchApp: null,      // Index into allowedApps array, or null (for multi-app/restricted)
    multiAppEdgeConfig: {     // Edge kiosk config for multi-app/restricted mode
        url: '',
        sourceType: 'url',    // 'url' or 'file'
        kioskType: 'fullscreen'
    }
};

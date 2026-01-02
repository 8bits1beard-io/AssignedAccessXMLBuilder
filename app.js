/* ============================================================================
   AssignedAccess XML Builder - Application Logic
   ============================================================================ */

/* ============================================================================
   GUID Generator
   ============================================================================ */
function generateGuid() {
    const guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    dom.get('profileId').value = '{' + guid + '}';
    updatePreview();
}

function copyProfileId() {
    copyToClipboard(dom.get('profileId').value);
}

/* ============================================================================
   Theme Toggle
   ============================================================================ */
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.querySelector('.theme-toggle').textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// Load saved theme (dark mode is default)
(function() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.body.setAttribute('data-theme', 'light');
        document.querySelector('.theme-toggle').textContent = '🌙';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        document.querySelector('.theme-toggle').textContent = '☀️';
    }
})();

/* ============================================================================
   Deploy Guide Modal
   ============================================================================ */
function showDeployHelp() {
    const modal = dom.get('deployModal');
    modal.classList.remove('hidden');
    modal.querySelector('.modal-close').focus();
    document.body.style.overflow = 'hidden';
}

function hideDeployHelp() {
    const modal = dom.get('deployModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function switchDeployTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.deploy-tab').forEach(btn => {
        const isActive = btn.id === `deploy-tab-${tabId}`;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });

    // Update content panels
    document.querySelectorAll('.deploy-content').forEach(panel => {
        const isActive = panel.id === `deploy-${tabId}`;
        panel.classList.toggle('active', isActive);
    });
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const deployModal = dom.get('deployModal');
        if (deployModal && !deployModal.classList.contains('hidden')) {
            hideDeployHelp();
        }
    }
});

/* ============================================================================
   Tab Navigation
   ============================================================================ */
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn, .side-nav-btn').forEach(btn => {
        const isActive = btn.id === `tab-btn-${tabId}`;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });

    // Update tab panels
    document.querySelectorAll('.tab-content').forEach(panel => {
        const isActive = panel.id === `tab-${tabId}`;
        panel.classList.toggle('active', isActive);
    });

    updateProgressRail();
}

function pulseTab(tabId) {
    const buttons = document.querySelectorAll(`#tab-btn-${tabId}, #tab-btn-${tabId}.side-nav-btn, #tab-btn-${tabId}.tab-btn`);
    buttons.forEach(btn => {
        btn.classList.add('pulse');
        setTimeout(() => btn.classList.remove('pulse'), 1800);
    });
}

function updateTabVisibility() {
    const isMultiOrRestricted = state.mode === 'multi' || state.mode === 'restricted';
    const startMenuTab = dom.get('tab-btn-startmenu');
    const systemTab = dom.get('tab-btn-system');

    // Show/hide tabs based on mode - both multi and restricted need these tabs
    startMenuTab.classList.toggle('hidden', !isMultiOrRestricted);
    systemTab.classList.toggle('hidden', !isMultiOrRestricted);

    // If switching to single mode and currently on a multi-only tab, switch to Application tab
    if (!isMultiOrRestricted) {
        const activeTab = document.querySelector('.side-nav-btn.active');
        if (activeTab && (activeTab.id === 'tab-btn-startmenu' || activeTab.id === 'tab-btn-system')) {
            switchTab('application');
        }
    }
}

/* ============================================================================
   Mode Switching
   ============================================================================ */
function setMode(mode) {
    state.mode = mode;

    const singleBtn = dom.get('modeSingle');
    const multiBtn = dom.get('modeMulti');
    const restrictedBtn = dom.get('modeRestricted');
    const singleConfig = dom.get('singleAppConfig');
    const multiConfig = dom.get('multiAppConfig');

    // Update mode buttons
    singleBtn.classList.toggle('active', mode === 'single');
    multiBtn.classList.toggle('active', mode === 'multi');
    restrictedBtn.classList.toggle('active', mode === 'restricted');
    singleBtn.setAttribute('aria-pressed', mode === 'single');
    multiBtn.setAttribute('aria-pressed', mode === 'multi');
    restrictedBtn.setAttribute('aria-pressed', mode === 'restricted');

    // Show/hide config panels - restricted uses same UI as multi-app
    singleConfig.classList.toggle('hidden', mode !== 'single');
    multiConfig.classList.toggle('hidden', mode === 'single');
    singleConfig.setAttribute('aria-hidden', mode !== 'single');
    multiConfig.setAttribute('aria-hidden', mode === 'single');

    // Update account type options based on mode
    updateAccountTypeOptions();

    // Update tab visibility based on mode
    updateTabVisibility();

    // Update auto-launch selector when switching to multi/restricted mode
    if (mode === 'multi' || mode === 'restricted') {
        updateAutoLaunchSelector();
    }

    updatePreview();
}

function updateAccountTypeOptions() {
    const groupBtn = dom.get('accountGroup');
    const globalBtn = dom.get('accountGlobal');
    const autoBtn = dom.get('accountAuto');
    const existingBtn = dom.get('accountExisting');

    if (state.mode === 'restricted') {
        // Show group and global options for restricted mode
        groupBtn.classList.remove('hidden');
        globalBtn.classList.remove('hidden');
        autoBtn.classList.add('hidden');
        existingBtn.classList.add('hidden');

        // Force restricted mode to group/global accounts only
        if (state.accountType === 'auto' || state.accountType === 'existing') {
            setAccountType('group');
        }
    } else {
        // Hide group and global options for single/multi modes
        groupBtn.classList.add('hidden');
        globalBtn.classList.add('hidden');
        autoBtn.classList.remove('hidden');
        existingBtn.classList.remove('hidden');

        // If currently on group or global, switch back to auto
        if (state.accountType === 'group' || state.accountType === 'global') {
            setAccountType('auto');
        }
    }
}

function setAccountType(type) {
    state.accountType = type;

    const autoBtn = dom.get('accountAuto');
    const existingBtn = dom.get('accountExisting');
    const groupBtn = dom.get('accountGroup');
    const globalBtn = dom.get('accountGlobal');
    const autoConfig = dom.get('autoLogonConfig');
    const existingConfig = dom.get('existingAccountConfig');
    const groupConfig = dom.get('groupAccountConfig');
    const globalConfig = dom.get('globalProfileConfig');

    // Update button states
    autoBtn.classList.toggle('active', type === 'auto');
    existingBtn.classList.toggle('active', type === 'existing');
    groupBtn.classList.toggle('active', type === 'group');
    globalBtn.classList.toggle('active', type === 'global');
    autoBtn.setAttribute('aria-pressed', type === 'auto');
    existingBtn.setAttribute('aria-pressed', type === 'existing');
    groupBtn.setAttribute('aria-pressed', type === 'group');
    globalBtn.setAttribute('aria-pressed', type === 'global');

    // Show/hide config panels
    autoConfig.classList.toggle('hidden', type !== 'auto');
    existingConfig.classList.toggle('hidden', type !== 'existing');
    groupConfig.classList.toggle('hidden', type !== 'group');
    globalConfig.classList.toggle('hidden', type !== 'global');
    autoConfig.setAttribute('aria-hidden', type !== 'auto');
    existingConfig.setAttribute('aria-hidden', type !== 'existing');
    groupConfig.setAttribute('aria-hidden', type !== 'group');
    globalConfig.setAttribute('aria-hidden', type !== 'global');

    updatePreview();
}

function updateAppTypeUI() {
    const appType = dom.get('appType').value;
    const edgeConfig = dom.get('edgeConfig');
    const uwpConfig = dom.get('uwpConfig');
    const win32Config = dom.get('win32Config');

    edgeConfig.classList.toggle('hidden', appType !== 'edge');
    uwpConfig.classList.toggle('hidden', appType !== 'uwp');
    win32Config.classList.toggle('hidden', appType !== 'win32');

    edgeConfig.setAttribute('aria-hidden', appType !== 'edge');
    uwpConfig.setAttribute('aria-hidden', appType !== 'uwp');
    win32Config.setAttribute('aria-hidden', appType !== 'win32');
}

/* ============================================================================
   Event Delegation
   ============================================================================ */
const actionHandlers = {
    loadPreset,
    loadConfig,
    saveConfig,
    saveConfigAs,
    importXml,
    showDeployHelp,
    hideDeployHelp,
    toggleTheme,
    switchTab,
    switchDeployTab,
    setMode,
    setAccountType,
    generateGuid,
    applySingleAppPreset,
    applyExampleConfig,
    addApp,
    addCommonApp,
    addPin,
    removeApp,
    removePin,
    updatePreview,
    updateAppTypeUI,
    updateEdgeSourceUI,
    updateBreakoutUI,
    updateBreakoutPreview,
    updateAutoLaunchSelection,
    updateMultiEdgeSourceUI,
    updateEdgeTileSourceUI,
    updatePinTargetPresets,
    applyPinTargetPreset,
    applyEditPinTargetPreset,
    applyTaskbarPinTargetPreset,
    applyEditTaskbarPinTargetPreset,
    updateTaskbarPinTypeUI,
    updateEditTaskbarPinTypeUI,
    updatePinEdgeArgsModeUI,
    updatePinEdgeArgsSourceUI,
    updateEditPinEdgeArgsModeUI,
    updateEditPinEdgeArgsSourceUI,
    updateTaskbarPinEdgeArgsModeUI,
    updateTaskbarPinEdgeArgsSourceUI,
    updateEditTaskbarEdgeArgsModeUI,
    updateEditTaskbarEdgeArgsSourceUI,
    applyEdgeArgsToPin,
    applyEdgeArgsToEditPin,
    applyEdgeArgsToTaskbarPin,
    applyEdgeArgsToEditTaskbarPin,
    toggleExportSection,
    editPin,
    saveEditPin,
    cancelEditPin,
    movePinUp,
    movePinDown,
    duplicatePin,
    addTaskbarPin,
    editTaskbarPin,
    saveTaskbarPin,
    cancelTaskbarPinEdit,
    removeTaskbarPin,
    moveTaskbarPinUp,
    moveTaskbarPinDown,
    pinAllowedToStart,
    pinAllowedToTaskbar,
    addAllowedEdgeTile,
    copyXml,
    downloadXml,
    downloadPowerShell,
    downloadShortcutsScript,
    downloadEdgeManifestWorkaround,
    downloadStartLayoutXml,
    addEdgeSecondaryTile,
    handleImport,
    handleConfigImport,
    copyProfileId,
    dismissCallout
};

function runAction(action, target, event) {
    const handler = actionHandlers[action];
    if (!handler) return;

    const arg = target?.dataset?.arg;
    if (action === 'handleImport' || action === 'handleConfigImport') {
        handler(event);
        return;
    }

    if (arg !== undefined) {
        if (action === 'removeApp' || action === 'removePin') {
            handler(parseInt(arg, 10));
        } else {
            handler(arg);
        }
        return;
    }

    handler();
}

function runActions(actionString, target, event) {
    actionString.split('|').forEach(action => {
        runAction(action.trim(), target, event);
    });
}

function dismissCallout(idOrElement) {
    const callout = typeof idOrElement === 'string'
        ? document.querySelector(`.callout[data-callout-id="${idOrElement}"]`)
        : idOrElement?.closest?.('.callout');
    if (!callout) return;
    const calloutId = callout.getAttribute('data-callout-id');
    if (calloutId) {
        sessionStorage.setItem(`callout:${calloutId}`, 'dismissed');
    }
    callout.classList.add('hidden');
}

function initCallouts() {
    document.querySelectorAll('.callout[data-callout-id]').forEach(callout => {
        const calloutId = callout.getAttribute('data-callout-id');
        if (calloutId && sessionStorage.getItem(`callout:${calloutId}`)) {
            callout.classList.add('hidden');
        }
    });
}

function applySingleAppPreset(preset) {
    if (!singleAppPresets || !singleAppPresets.presets) {
        alert('Single-app presets are not available yet. Please try again.');
        return;
    }

    const config = singleAppPresets.presets[preset];
    if (!config) return;

    const appTypeSelect = dom.get('appType');
    const edgeSourceType = dom.get('edgeSourceType');
    const edgeUrl = dom.get('edgeUrl');
    const edgeKioskType = dom.get('edgeKioskType');
    const win32Path = dom.get('win32Path');
    const win32Args = dom.get('win32Args');

    appTypeSelect.value = config.appType;

    if (config.appType === 'edge') {
        edgeSourceType.value = config.sourceType || 'url';
        edgeUrl.value = config.url || edgeUrl.value || 'https://www.microsoft.com';
        edgeKioskType.value = config.kioskType || 'fullscreen';
        updateAppTypeUI();
        updateEdgeSourceUI();
        updatePreview();
        return;
    }

    win32Path.value = config.path || '';
    win32Args.value = config.args || '';

    updateAppTypeUI();
    updatePreview();
}

function applyExampleConfig(example) {
    switch (example) {
        case 'lobbyEdge':
            loadPreset('edgeFullscreen');
            dom.get('configName').value = 'Lobby-Edge';
            dom.get('edgeUrl').value = dom.get('edgeUrl').value || 'https://www.microsoft.com';
            updatePreview();
            pulseTab('application');
            switchTab('application');
            return;
        case 'receptionMulti':
            loadPreset('multiApp');
            dom.get('configName').value = 'Reception-Kiosk';
            addExamplePins(['%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe', 'Microsoft.WindowsCalculator_8wekyb3d8bbwe!App']);
            updatePreview();
            pulseTab('startmenu');
            switchTab('startmenu');
            return;
        case 'classroomRestricted':
            setMode('restricted');
            setAccountType('group');
            generateGuid();
            dom.get('configName').value = 'Classroom-Restricted';
            dom.get('groupType').value = 'LocalGroup';
            dom.get('groupName').value = 'KioskUsers';
            state.allowedApps = [];
            state.startPins = [];
            state.autoLaunchApp = null;
            addCommonApp('edge');
            addCommonApp('calculator');
            dom.get('showTaskbar').checked = true;
            dom.get('fileExplorerAccess').value = 'downloads';
            addExamplePins(['%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe', 'Microsoft.WindowsCalculator_8wekyb3d8bbwe!App']);
            updatePreview();
            pulseTab('application');
            switchTab('application');
            return;
        default:
            return;
    }
}

function addExamplePins(values) {
    values.forEach(value => {
        const index = state.allowedApps.findIndex(app => app.value === value);
        if (index >= 0) {
            pinAllowedToStart(index);
        }
    });
}

function updateEdgeSourceUI() {
    const sourceType = dom.get('edgeSourceType').value;
    const urlConfig = dom.get('edgeUrlConfig');
    const fileConfig = dom.get('edgeFileConfig');

    urlConfig.classList.toggle('hidden', sourceType !== 'url');
    fileConfig.classList.toggle('hidden', sourceType !== 'file');

    urlConfig.setAttribute('aria-hidden', sourceType !== 'url');
    fileConfig.setAttribute('aria-hidden', sourceType !== 'file');
}

function updateEdgeTileSourceUI() {
    const sourceType = dom.get('edgeTileSourceType').value;
    const urlConfig = dom.get('edgeTileUrlConfig');
    const fileConfig = dom.get('edgeTileFileConfig');

    urlConfig.classList.toggle('hidden', sourceType !== 'url');
    fileConfig.classList.toggle('hidden', sourceType !== 'file');

    urlConfig.setAttribute('aria-hidden', sourceType !== 'url');
    fileConfig.setAttribute('aria-hidden', sourceType !== 'file');
}

function updateTaskbarPinTypeUI() {
    const type = dom.get('taskbarPinType')?.value || 'desktopAppLink';
    const packaged = dom.get('taskbarPackagedFields');
    const desktop = dom.get('taskbarDesktopFields');
    if (!packaged || !desktop) return;
    const isPackaged = type === 'packagedAppId';
    packaged.classList.toggle('hidden', !isPackaged);
    packaged.setAttribute('aria-hidden', !isPackaged);
    desktop.classList.toggle('hidden', isPackaged);
    desktop.setAttribute('aria-hidden', isPackaged);
}

function updateEditTaskbarPinTypeUI() {
    const type = dom.get('editTaskbarPinType')?.value || 'desktopAppLink';
    const packaged = dom.get('editTaskbarPackagedFields');
    const desktop = dom.get('editTaskbarDesktopFields');
    if (!packaged || !desktop) return;
    const isPackaged = type === 'packagedAppId';
    packaged.classList.toggle('hidden', !isPackaged);
    packaged.setAttribute('aria-hidden', !isPackaged);
    desktop.classList.toggle('hidden', isPackaged);
    desktop.setAttribute('aria-hidden', isPackaged);
}

function updatePinTargetPresets() {
    const presetSelect = dom.get('pinTargetPreset');
    const editPresetSelect = dom.get('editPinTargetPreset');
    const taskbarPresetSelect = dom.get('taskbarPinTargetPreset');
    const editTaskbarPresetSelect = dom.get('editTaskbarPinTargetPreset');
    const allowedPaths = state.allowedApps
        .filter(app => app.type === 'path' && !isHelperExecutable(app.value))
        .map(app => app.value);
    const uniquePaths = Array.from(new Set(allowedPaths));

    const optionsHtml = ['<option value="">Use allowed app (optional)</option>']
        .concat(uniquePaths.map(path => `<option value="${escapeXml(path)}">${escapeXml(path)}</option>`))
        .join('');

    if (presetSelect) {
        presetSelect.innerHTML = optionsHtml;
    }
    if (editPresetSelect) {
        editPresetSelect.innerHTML = ['<option value="">Select allowed app</option>']
            .concat(uniquePaths.map(path => `<option value="${escapeXml(path)}">${escapeXml(path)}</option>`))
            .join('');
    }
    if (taskbarPresetSelect) {
        taskbarPresetSelect.innerHTML = ['<option value="">Select allowed app</option>']
            .concat(uniquePaths.map(path => `<option value="${escapeXml(path)}">${escapeXml(path)}</option>`))
            .join('');
    }
    if (editTaskbarPresetSelect) {
        editTaskbarPresetSelect.innerHTML = ['<option value="">Select allowed app</option>']
            .concat(uniquePaths.map(path => `<option value="${escapeXml(path)}">${escapeXml(path)}</option>`))
            .join('');
    }
}

function applyPinTargetPreset() {
    const presetSelect = dom.get('pinTargetPreset');
    const targetInput = dom.get('pinTarget');
    if (!presetSelect || !targetInput) return;
    const value = presetSelect.value;
    if (value) {
        targetInput.value = value;
        syncEdgeArgsField('pin');
        updateEdgeArgsVisibility('pin', 'pinTarget', 'pinEdgeArgsGroup');
    }
}

function applyEditPinTargetPreset() {
    const presetSelect = dom.get('editPinTargetPreset');
    const targetInput = dom.get('editPinTarget');
    if (!presetSelect || !targetInput) return;
    const value = presetSelect.value;
    if (value) {
        targetInput.value = value;
        syncEdgeArgsField('editPin');
        updateEdgeArgsVisibility('editPin', 'editPinTarget', 'editPinEdgeArgsGroup');
    }
}

function applyTaskbarPinTargetPreset() {
    const presetSelect = dom.get('taskbarPinTargetPreset');
    const targetInput = dom.get('taskbarPinTarget');
    if (!presetSelect || !targetInput) return;
    const value = presetSelect.value;
    if (value) {
        targetInput.value = value;
        syncEdgeArgsField('taskbarPin');
        updateEdgeArgsVisibility('taskbarPin', 'taskbarPinTarget', 'taskbarPinEdgeArgsGroup');
    }
}

function applyEditTaskbarPinTargetPreset() {
    const presetSelect = dom.get('editTaskbarPinTargetPreset');
    const targetInput = dom.get('editTaskbarPinTarget');
    if (!presetSelect || !targetInput) return;
    const value = presetSelect.value;
    if (value) {
        targetInput.value = value;
        syncEdgeArgsField('editTaskbar');
        updateEdgeArgsVisibility('editTaskbar', 'editTaskbarPinTarget', 'editTaskbarEdgeArgsGroup');
    }
}

function updateEdgeArgsModeUI(prefix) {
    const mode = dom.get(`${prefix}EdgeArgsMode`)?.value;
    const sourceConfig = dom.get(`${prefix}EdgeArgsSourceConfig`);
    const idleConfig = dom.get(`${prefix}EdgeArgsIdleConfig`);
    if (!mode || !sourceConfig || !idleConfig) return;
    const needsSource = mode === 'kioskFullscreen' || mode === 'kioskPublic';
    sourceConfig.classList.toggle('hidden', !needsSource);
    sourceConfig.setAttribute('aria-hidden', !needsSource);
    idleConfig.classList.toggle('hidden', !needsSource);
    idleConfig.setAttribute('aria-hidden', !needsSource);
    if (needsSource) {
        updateEdgeArgsSourceUI(prefix);
    }
    syncEdgeArgsField(prefix);
}

function updateEdgeArgsSourceUI(prefix) {
    const sourceType = dom.get(`${prefix}EdgeArgsSourceType`)?.value;
    const urlConfig = dom.get(`${prefix}EdgeArgsUrlConfig`);
    const fileConfig = dom.get(`${prefix}EdgeArgsFileConfig`);
    if (!sourceType || !urlConfig || !fileConfig) return;
    urlConfig.classList.toggle('hidden', sourceType !== 'url');
    fileConfig.classList.toggle('hidden', sourceType !== 'file');
    urlConfig.setAttribute('aria-hidden', sourceType !== 'url');
    fileConfig.setAttribute('aria-hidden', sourceType !== 'file');
    syncEdgeArgsField(prefix);
}

function updatePinEdgeArgsModeUI() {
    updateEdgeArgsModeUI('pin');
}

function updatePinEdgeArgsSourceUI() {
    updateEdgeArgsSourceUI('pin');
}

function updateEditPinEdgeArgsModeUI() {
    updateEdgeArgsModeUI('editPin');
}

function updateEditPinEdgeArgsSourceUI() {
    updateEdgeArgsSourceUI('editPin');
}

function updateTaskbarPinEdgeArgsModeUI() {
    updateEdgeArgsModeUI('taskbarPin');
}

function updateTaskbarPinEdgeArgsSourceUI() {
    updateEdgeArgsSourceUI('taskbarPin');
}

function updateEditTaskbarEdgeArgsModeUI() {
    updateEdgeArgsModeUI('editTaskbar');
}

function updateEditTaskbarEdgeArgsSourceUI() {
    updateEdgeArgsSourceUI('editTaskbar');
}

function buildEdgeArgsFromUi(prefix, options = {}) {
    const { suppressAlert = false } = options;
    const mode = dom.get(`${prefix}EdgeArgsMode`)?.value || 'standard';
    if (mode === 'standard') {
        return '';
    }
    const sourceType = dom.get(`${prefix}EdgeArgsSourceType`)?.value || 'url';
    const url = buildLaunchUrl(
        sourceType,
        dom.get(`${prefix}EdgeArgsUrl`)?.value.trim(),
        dom.get(`${prefix}EdgeArgsFilePath`)?.value,
        ''
    );
    if (!url) {
        if (!suppressAlert) {
            alert('Edge kiosk mode requires a URL or local file path.');
        }
        return '';
    }
    const kioskType = mode === 'kioskPublic' ? 'public-browsing' : 'fullscreen';
    const idleTimeout = parseInt(dom.get(`${prefix}EdgeArgsIdle`)?.value, 10) || 0;
    return buildEdgeKioskArgs(url, kioskType, idleTimeout);
}

function syncEdgeArgsField(prefix) {
    const fieldMap = {
        pin: ['pinTarget', 'pinArgs'],
        editPin: ['editPinTarget', 'editPinArgs'],
        taskbarPin: ['taskbarPinTarget', 'taskbarPinArgs'],
        editTaskbar: ['editTaskbarPinTarget', 'editTaskbarPinArgs']
    };
    const ids = fieldMap[prefix];
    if (!ids) return;
    const targetInput = dom.get(ids[0]);
    const argsInput = dom.get(ids[1]);
    if (!targetInput || !argsInput) return;
    if (!isEdgeApp(targetInput.value)) {
        const mode = dom.get(`${prefix}EdgeArgsMode`)?.value || 'standard';
        if (mode !== 'standard') {
            argsInput.value = '';
        }
        return;
    }
    argsInput.value = buildEdgeArgsFromUi(prefix, { suppressAlert: true });
}

function updateEdgeArgsVisibility(prefix, targetInputId, groupId) {
    const targetInput = dom.get(targetInputId);
    const group = dom.get(groupId);
    if (!targetInput || !group) return;
    const show = isEdgeApp(targetInput.value);
    group.classList.toggle('hidden', !show);
    group.setAttribute('aria-hidden', !show);
}

function getEdgeArgsPrefixFromId(id) {
    if (!id) return '';
    if (id === 'pinTarget') return 'pin';
    if (id === 'editPinTarget') return 'editPin';
    if (id === 'taskbarPinTarget') return 'taskbarPin';
    if (id === 'editTaskbarPinTarget') return 'editTaskbar';
    if (id.startsWith('pinEdgeArgs')) return 'pin';
    if (id.startsWith('editPinEdgeArgs')) return 'editPin';
    if (id.startsWith('taskbarPinEdgeArgs')) return 'taskbarPin';
    if (id.startsWith('editTaskbarEdgeArgs')) return 'editTaskbar';
    return '';
}

function getEdgeArgsTargetConfigFromId(id) {
    switch (id) {
        case 'pinTarget':
            return { prefix: 'pin', targetId: 'pinTarget', groupId: 'pinEdgeArgsGroup' };
        case 'editPinTarget':
            return { prefix: 'editPin', targetId: 'editPinTarget', groupId: 'editPinEdgeArgsGroup' };
        case 'taskbarPinTarget':
            return { prefix: 'taskbarPin', targetId: 'taskbarPinTarget', groupId: 'taskbarPinEdgeArgsGroup' };
        case 'editTaskbarPinTarget':
            return { prefix: 'editTaskbar', targetId: 'editTaskbarPinTarget', groupId: 'editTaskbarEdgeArgsGroup' };
        default:
            return null;
    }
}

function applyEdgeArgs(prefix, targetInputId, argsInputId) {
    const targetInput = dom.get(targetInputId);
    const argsInput = dom.get(argsInputId);
    if (!targetInput || !argsInput) return;
    if (!isEdgeApp(targetInput.value)) {
        alert('Edge options apply only when the target is msedge.exe.');
        return;
    }
    const args = buildEdgeArgsFromUi(prefix);
    if (args) {
        argsInput.value = args;
    }
}

function applyEdgeArgsToPin() {
    applyEdgeArgs('pin', 'pinTarget', 'pinArgs');
}

function applyEdgeArgsToEditPin() {
    applyEdgeArgs('editPin', 'editPinTarget', 'editPinArgs');
}

function applyEdgeArgsToTaskbarPin() {
    applyEdgeArgs('taskbarPin', 'taskbarPinTarget', 'taskbarPinArgs');
}

function applyEdgeArgsToEditTaskbarPin() {
    applyEdgeArgs('editTaskbar', 'editTaskbarPinTarget', 'editTaskbarPinArgs');
}

function renderTaskbarPinList() {
    const list = dom.get('taskbarPinList');
    const count = dom.get('taskbarPinCount');
    if (!list || !count) return;

    const filteredPins = state.taskbarPins
        .filter(pin => pin.pinType === 'desktopAppLink' || pin.pinType === 'packagedAppId');

    count.textContent = filteredPins.length;

    if (filteredPins.length === 0) {
        list.innerHTML = '<div class="empty-list" role="listitem">No taskbar pins configured</div>';
        return;
    }

    list.innerHTML = filteredPins.map((pin, i) => {
        const isUwp = pin.pinType === 'packagedAppId';
        const displayTarget = isUwp
            ? pin.packagedAppId
            : (pin.target || pin.systemShortcut || '(no shortcut path)');
        const warningStyle = !isUwp && !pin.systemShortcut && !pin.target
            ? 'color: var(--error-color, #e74c3c);'
            : 'color: var(--text-secondary);';
        const linkBadge = pin.pinType === 'desktopAppLink'
            ? '<span style="background: var(--bg-tertiary); color: var(--text-secondary); padding: 1px 4px; border-radius: 3px; font-size: 0.65rem; margin-left: 6px;">.lnk</span>'
            : '';
        const edgeBadge = isEdgeBackedDesktopPin(pin)
            ? '<span style="background: var(--bg-tertiary); color: var(--text-secondary); padding: 1px 4px; border-radius: 3px; font-size: 0.65rem; margin-left: 4px;">Edge</span>'
            : '';
        const edgeWarning = shouldWarnEdgeShortcutPin(pin)
            ? '<span style="font-size: 0.7rem; color: var(--warning-color, #b26a00);">Note: Edge-backed shortcuts may show as \'Microsoft Edge\' with the Edge icon in Assigned Access; custom .lnk name/icon may be ignored.</span>'
            : '';
        return `
        <div class="app-item draggable" role="listitem" data-pin-list="taskbar" data-index="${i}" draggable="true">
            <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
                <span style="font-weight: 500;">${escapeXml(pin.name || 'Unnamed')}${linkBadge}${edgeBadge}</span>
                <span style="font-size: 0.75rem; ${warningStyle} overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeXml(displayTarget)}">${escapeXml(displayTarget)}</span>
                ${edgeWarning}
            </div>
            <div class="pin-actions">
                <button type="button" class="btn-icon btn-small" data-action="moveTaskbarPinUp" data-arg="${i}" aria-label="Move ${escapeXml(pin.name || 'pin')} up" ${i === 0 ? 'disabled' : ''}>
                    <span aria-hidden="true">↑</span>
                </button>
                <button type="button" class="btn-icon btn-small" data-action="moveTaskbarPinDown" data-arg="${i}" aria-label="Move ${escapeXml(pin.name || 'pin')} down" ${i === filteredPins.length - 1 ? 'disabled' : ''}>
                    <span aria-hidden="true">↓</span>
                </button>
                <button type="button" class="btn-icon btn-small" data-action="editTaskbarPin" data-arg="${i}" aria-label="Edit ${escapeXml(pin.name || 'pin')}">
                    <span aria-hidden="true">✎</span>
                </button>
                <button type="button" class="remove-btn" data-action="removeTaskbarPin" data-arg="${i}" aria-label="Remove ${escapeXml(pin.name || 'pin')}">
                    <span aria-hidden="true">✕</span>
                </button>
            </div>
        </div>
    `;
    }).join('');
}

function addTaskbarPin() {
    const name = dom.get('taskbarPinName').value.trim();
    const type = dom.get('taskbarPinType').value;
    const value = dom.get('taskbarPinValue').value.trim();
    const target = dom.get('taskbarPinTarget').value.trim();

    if (!name) {
        alert('Taskbar pin name is required.');
        return;
    }

    if (type === 'packagedAppId' && !value) {
        alert('Packaged app ID is required.');
        return;
    }

    if (type === 'desktopAppLink' && !target) {
        alert('Target path is required for taskbar shortcuts.');
        return;
    }

    const pin = {
        name: name,
        pinType: type === 'packagedAppId' ? 'packagedAppId' : 'desktopAppLink',
        packagedAppId: type === 'packagedAppId' ? value : '',
        systemShortcut: '',
        target: type === 'desktopAppLink' ? target : '',
        args: type === 'desktopAppLink' ? dom.get('taskbarPinArgs').value.trim() : '',
        workingDir: type === 'desktopAppLink' ? dom.get('taskbarPinWorkingDir').value.trim() : '',
        iconPath: type === 'desktopAppLink' ? dom.get('taskbarPinIconPath').value.trim() : ''
    };

    state.taskbarPins.push(pin);

    dom.get('taskbarPinName').value = '';
    dom.get('taskbarPinValue').value = '';
    dom.get('taskbarPinTarget').value = '';
    dom.get('taskbarPinArgs').value = '';
    dom.get('taskbarPinWorkingDir').value = '';
    dom.get('taskbarPinIconPath').value = '';
    updateEdgeArgsVisibility('taskbarPin', 'taskbarPinTarget', 'taskbarPinEdgeArgsGroup');

    renderTaskbarPinList();
    updatePreview();
}

function editTaskbarPin(index) {
    const pin = state.taskbarPins[index];
    if (!pin) return;
    editingTaskbarPinIndex = index;

    dom.get('editTaskbarPinName').value = pin.name || '';
    dom.get('editTaskbarPinType').value = pin.pinType || 'desktopAppLink';
    dom.get('editTaskbarPinValue').value = pin.pinType === 'packagedAppId'
        ? (pin.packagedAppId || '')
        : '';
    dom.get('editTaskbarPinTarget').value = pin.pinType === 'desktopAppLink'
        ? (pin.target || '')
        : '';
    dom.get('editTaskbarPinArgs').value = pin.pinType === 'desktopAppLink'
        ? (pin.args || '')
        : '';
    dom.get('editTaskbarPinWorkingDir').value = pin.pinType === 'desktopAppLink'
        ? (pin.workingDir || '')
        : '';
    dom.get('editTaskbarPinIconPath').value = pin.iconPath || '';
    updateEdgeArgsVisibility('editTaskbar', 'editTaskbarPinTarget', 'editTaskbarEdgeArgsGroup');
    updateEditTaskbarPinTypeUI();

    dom.get('taskbarEditPanel').classList.remove('hidden');
    dom.get('taskbarEditPanel').setAttribute('aria-hidden', 'false');
}

function saveTaskbarPin() {
    if (editingTaskbarPinIndex === null) return;
    const pin = state.taskbarPins[editingTaskbarPinIndex];
    if (!pin) return;

    const name = dom.get('editTaskbarPinName').value.trim();
    const type = dom.get('editTaskbarPinType').value;
    const value = dom.get('editTaskbarPinValue').value.trim();
    const target = dom.get('editTaskbarPinTarget').value.trim();

    if (!name) {
        alert('Taskbar pin name is required.');
        return;
    }

    if (type === 'packagedAppId' && !value) {
        alert('Packaged app ID is required.');
        return;
    }

    if (type === 'desktopAppLink' && !target) {
        alert('Target path is required for taskbar shortcuts.');
        return;
    }

    pin.name = name;
    pin.pinType = type === 'packagedAppId' ? 'packagedAppId' : 'desktopAppLink';
    pin.packagedAppId = type === 'packagedAppId' ? value : '';
    pin.systemShortcut = '';
    pin.target = type === 'desktopAppLink' ? target : '';
    pin.args = type === 'desktopAppLink' ? dom.get('editTaskbarPinArgs').value.trim() : '';
    pin.workingDir = type === 'desktopAppLink' ? dom.get('editTaskbarPinWorkingDir').value.trim() : '';
    pin.iconPath = type === 'packagedAppId' ? '' : dom.get('editTaskbarPinIconPath').value.trim();

    renderTaskbarPinList();
    updatePreview();
    cancelTaskbarPinEdit();
}

function cancelTaskbarPinEdit() {
    editingTaskbarPinIndex = null;
    dom.get('taskbarEditPanel').classList.add('hidden');
    dom.get('taskbarEditPanel').setAttribute('aria-hidden', 'true');
}

function removeTaskbarPin(index) {
    state.taskbarPins.splice(index, 1);
    renderTaskbarPinList();
    updatePreview();
}

function moveTaskbarPinUp(index) {
    if (index <= 0) return;
    const [pin] = state.taskbarPins.splice(index, 1);
    state.taskbarPins.splice(index - 1, 0, pin);
    renderTaskbarPinList();
    updatePreview();
}

function moveTaskbarPinDown(index) {
    if (index >= state.taskbarPins.length - 1) return;
    const [pin] = state.taskbarPins.splice(index, 1);
    state.taskbarPins.splice(index + 1, 0, pin);
    renderTaskbarPinList();
    updatePreview();
}

let dragPinContext = null;

function handlePinDragStart(event) {
    const item = event.target.closest('.app-item.draggable');
    if (!item || item.getAttribute('draggable') !== 'true') return;
    dragPinContext = {
        list: item.dataset.pinList,
        index: parseInt(item.dataset.index, 10)
    };
    item.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', 'pin');
}

function handlePinDragOver(event) {
    const target = event.target.closest('.app-item.draggable');
    if (!dragPinContext || !target || target.dataset.pinList !== dragPinContext.list) return;
    event.preventDefault();
    target.classList.add('drag-over');
}

function handlePinDragLeave(event) {
    const target = event.target.closest('.app-item.draggable');
    if (target) {
        target.classList.remove('drag-over');
    }
}

function handlePinDrop(event) {
    const target = event.target.closest('.app-item.draggable');
    if (!dragPinContext || !target || target.dataset.pinList !== dragPinContext.list) return;
    event.preventDefault();

    const toIndex = parseInt(target.dataset.index, 10);
    const fromIndex = dragPinContext.index;
    if (Number.isNaN(toIndex) || Number.isNaN(fromIndex) || toIndex === fromIndex) {
        dragPinContext = null;
        return;
    }

    const pins = dragPinContext.list === 'start' ? state.startPins : state.taskbarPins;
    if (!pins || !pins[fromIndex]) {
        dragPinContext = null;
        return;
    }

    const [moved] = pins.splice(fromIndex, 1);
    pins.splice(toIndex, 0, moved);

    dragPinContext = null;
    if (target.dataset.pinList === 'start') {
        renderPinList();
    } else {
        renderTaskbarPinList();
    }
    updatePreview();
}

function handlePinDragEnd(event) {
    const item = event.target.closest('.app-item.draggable');
    if (item) {
        item.classList.remove('dragging');
    }
    document.querySelectorAll('.app-item.drag-over').forEach(el => el.classList.remove('drag-over'));
    dragPinContext = null;
}
let editingPinIndex = null;
let editingTaskbarPinIndex = null;

function getEdgeUrl() {
    const sourceType = dom.get('edgeSourceType').value;
    return buildLaunchUrl(
        sourceType,
        dom.get('edgeUrl').value,
        dom.get('edgeFilePath').value,
        'https://www.microsoft.com'
    );
}

function getEdgeTileLaunchUrl() {
    const sourceType = dom.get('edgeTileSourceType').value;
    return buildLaunchUrl(
        sourceType,
        dom.get('edgeTileUrl').value.trim(),
        dom.get('edgeTileFilePath').value,
        ''
    );
}

function normalizeTileUrl(input) {
    if (!input) return '';
    const trimmed = input.trim();
    if (/^https?:\/\//i.test(trimmed) || /^file:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return buildFileUrl(trimmed);
}

function isEdgeBackedDesktopPin(pin) {
    if (!pin || pin.pinType !== 'desktopAppLink') return false;
    if (pin.target && (isEdgeApp(pin.target) || pin.target.toLowerCase().includes('msedge.exe'))) {
        return true;
    }
    if (pin.systemShortcut) {
        const shortcut = pin.systemShortcut.toLowerCase();
        return shortcut.includes('microsoft edge.lnk') ||
            shortcut.includes('\\microsoft\\edge\\application\\');
    }
    return false;
}

function shouldWarnEdgeShortcutPin(pin) {
    if (!isEdgeBackedDesktopPin(pin)) return false;
    const name = (pin.name || '').trim().toLowerCase();
    const hasCustomName = name && name !== 'microsoft edge';
    const hasCustomIcon = !!(pin.iconPath && pin.iconPath.trim());
    return hasCustomName || hasCustomIcon;
}

function getEdgeShortcutWarningPins() {
    const pins = []
        .concat(state.startPins || [])
        .concat(state.taskbarPins || []);
    return pins
        .filter(pin => shouldWarnEdgeShortcutPin(pin))
        .map(pin => pin.name || '(unnamed)');
}

function hasDesktopAppLinks() {
    const pins = []
        .concat(state.startPins || [])
        .concat(state.taskbarPins || []);
    return pins.some(pin => pin.pinType === 'desktopAppLink');
}

function hasEdgeBackedDesktopLinks() {
    const pins = []
        .concat(state.startPins || [])
        .concat(state.taskbarPins || []);
    return pins.some(pin => isEdgeBackedDesktopPin(pin));
}

function updateBreakoutUI() {
    const enabled = dom.get('enableBreakout').checked;
    const breakoutConfig = dom.get('breakoutConfig');
    breakoutConfig.classList.toggle('hidden', !enabled);
    breakoutConfig.setAttribute('aria-hidden', !enabled);
    updateBreakoutPreview();
}

function updateBreakoutPreview() {
    const ctrl = dom.get('breakoutCtrl').checked;
    const alt = dom.get('breakoutAlt').checked;
    const shift = dom.get('breakoutShift').checked;
    const key = dom.get('breakoutFinalKey').value;

    let combo = [];
    if (ctrl) combo.push('Ctrl');
    if (alt) combo.push('Alt');
    if (shift) combo.push('Shift');
    combo.push(key);

    dom.get('breakoutPreview').textContent = combo.join('+');
}

function getBreakoutSequence() {
    if (!dom.get('enableBreakout').checked) return null;

    const ctrl = dom.get('breakoutCtrl').checked;
    const alt = dom.get('breakoutAlt').checked;
    const shift = dom.get('breakoutShift').checked;
    const key = dom.get('breakoutFinalKey').value;

    // Build the key string in the format expected by AssignedAccess
    let combo = [];
    if (ctrl) combo.push('Ctrl');
    if (alt) combo.push('Alt');
    if (shift) combo.push('Shift');
    combo.push(key);

    return combo.join('+');
}

/* ============================================================================
   Multi-App Auto-Launch Functions
   ============================================================================ */
function getMultiAppEdgeUrl() {
    const sourceType = dom.get('multiEdgeSourceType').value;
    return buildLaunchUrl(
        sourceType,
        dom.get('multiEdgeUrl').value,
        dom.get('multiEdgeFilePath').value,
        'https://www.microsoft.com'
    );
}

function isHelperExecutable(value) {
    if (!value) return false;
    const lowerValue = value.toLowerCase();
    // Filter out helper executables that shouldn't be auto-launched
    return lowerValue.includes('_proxy.exe') ||
           lowerValue.includes('edgeupdate') ||
           lowerValue.includes('update.exe') ||
           lowerValue.includes('crashhandler');
}

function shouldSkipAutoLaunch(app) {
    if (!app) return true;
    if (app.skipAutoLaunch) return true;
    return isHelperExecutable(app.value);
}

function updateAutoLaunchSelector() {
    const select = dom.get('autoLaunchApp');
    const currentValue = select.value;

    // Clear all options except "None"
    select.innerHTML = '<option value="">None (show Start menu)</option>';

    // Add allowed apps as options (skip helper executables)
    state.allowedApps.forEach((app, index) => {
        // Skip helper executables - they shouldn't be auto-launched
        if (shouldSkipAutoLaunch(app)) {
            return;
        }

        const option = document.createElement('option');
        option.value = index;
        // Create a friendly display name
        let displayName = app.value;
        if (displayName.length > 50) {
            displayName = '...' + displayName.slice(-47);
        }
        if (isEdgeApp(app.value)) {
            displayName = 'Microsoft Edge';
        }
        option.textContent = displayName;
        select.appendChild(option);
    });

    // Restore selection if still valid
    if (currentValue !== '' &&
        state.allowedApps[parseInt(currentValue)] &&
        !shouldSkipAutoLaunch(state.allowedApps[parseInt(currentValue)])) {
        select.value = currentValue;
    } else {
        select.value = '';
        state.autoLaunchApp = null;
    }

    updateMultiAppEdgeUI();
}

function updateAutoLaunchSelection() {
    const select = dom.get('autoLaunchApp');
    const value = select.value;

    if (value === '') {
        state.autoLaunchApp = null;
    } else {
        state.autoLaunchApp = parseInt(value);
    }

    updateMultiAppEdgeUI();
}

function updateMultiAppEdgeUI() {
    const edgeConfig = dom.get('multiAppEdgeConfig');
    const win32ArgsConfig = dom.get('win32ArgsConfig');

    // Show Edge config only if an Edge app is selected for auto-launch
    // Show Win32 args config if a non-Edge Win32 app is selected for auto-launch
    let showEdgeConfig = false;
    let showWin32Args = false;

    if (state.autoLaunchApp !== null && state.allowedApps[state.autoLaunchApp]) {
        const app = state.allowedApps[state.autoLaunchApp];
        if (isEdgeApp(app.value)) {
            showEdgeConfig = true;
        } else if (app.type === 'path') {
            // Win32 app (not Edge)
            showWin32Args = true;
        }
    }

    edgeConfig.classList.toggle('hidden', !showEdgeConfig);
    edgeConfig.setAttribute('aria-hidden', !showEdgeConfig);

    win32ArgsConfig.classList.toggle('hidden', !showWin32Args);
    win32ArgsConfig.setAttribute('aria-hidden', !showWin32Args);
}

function updateMultiEdgeSourceUI() {
    const sourceType = dom.get('multiEdgeSourceType').value;
    const urlGroup = dom.get('multiEdgeUrlGroup');
    const fileGroup = dom.get('multiEdgeFileGroup');

    urlGroup.classList.toggle('hidden', sourceType !== 'url');
    fileGroup.classList.toggle('hidden', sourceType !== 'file');

    urlGroup.setAttribute('aria-hidden', sourceType !== 'url');
    fileGroup.setAttribute('aria-hidden', sourceType !== 'file');
}

/* ============================================================================
   App List Management (Multi-App Mode)
   ============================================================================ */
function addAllowedApp(app, options = {}) {
    if (!app || !app.value) return false;

    if (state.allowedApps.find(a => a.value === app.value)) {
        return false;
    }

    const entry = { ...app };
    if (options.skipAutoPin || entry.skipAutoPin) {
        entry.skipAutoPin = true;
    }
    if (options.skipAutoLaunch || entry.skipAutoLaunch) {
        entry.skipAutoLaunch = true;
    }

    state.allowedApps.push(entry);

    return true;
}

function ensureEdgeDependencies(app) {
    if (!appPresets?.apps) return;

    const value = (app.value || '').toLowerCase();
    const isEdgeValue = isEdgeApp(app.value) ||
        value === 'microsoft.microsoftedge.stable_8wekyb3d8bbwe!app';

    if (!isEdgeValue) return;

    ['edge', 'edgeProxy', 'edgeAppId'].forEach(key => {
        const edgeApp = appPresets.apps[key];
        if (!edgeApp) return;
        const isDependency = key !== 'edge';
        addAllowedApp(edgeApp, { skipAutoPin: isDependency, skipAutoLaunch: isDependency });
    });
}

function addApp() {
    const type = dom.get('addAppType').value;
    const value = dom.get('addAppValue').value.trim();

    if (!value) return;

    const added = addAllowedApp({ type, value });
    dom.get('addAppValue').value = '';
    if (added) {
        ensureEdgeDependencies({ type, value });
    }
    renderAppList();
    updateAutoLaunchSelector();
    updatePinTargetPresets();
    updatePreview();
}

function addCommonApp(appKey) {
    if (!appPresets) {
        console.error('App presets not loaded');
        return;
    }

    const apps = appPresets.apps;
    const groups = appPresets.groups;
    // Check if this key has a group (multiple apps to add)
    if (groups[appKey]) {
        groups[appKey].forEach(key => {
            const app = apps[key];
            addAllowedApp(app, { skipAutoPin: app?.skipAutoPin, skipAutoLaunch: app?.skipAutoLaunch });
        });
    } else {
        // Single app
        const app = apps[appKey];
        addAllowedApp(app, { skipAutoPin: app?.skipAutoPin, skipAutoLaunch: app?.skipAutoLaunch });
    }

    renderAppList();
    updateAutoLaunchSelector();
    updatePinTargetPresets();
    updatePreview();
}

function removeApp(index) {
    // If we're removing the auto-launch app, reset the selection
    if (state.autoLaunchApp === index) {
        state.autoLaunchApp = null;
    } else if (state.autoLaunchApp !== null && state.autoLaunchApp > index) {
        // Adjust index if we removed an app before the auto-launch app
        state.autoLaunchApp--;
    }

    state.allowedApps.splice(index, 1);
    renderAppList();
    updateAutoLaunchSelector();
    updatePinTargetPresets();
    updatePreview();
}

function renderAppList() {
    const list = dom.get('appList');
    const count = dom.get('appCount');

    count.textContent = state.allowedApps.length;

    if (state.allowedApps.length === 0) {
        list.innerHTML = '<div class="empty-list" role="status">No apps added yet</div>';
        return;
    }

    list.innerHTML = state.allowedApps.map((app, i) => {
        const isEdge = isEdgeApp(app.value) || app.value === 'Microsoft.MicrosoftEdge.Stable_8wekyb3d8bbwe!App';
        return `
        <div class="app-item" role="listitem">
            <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
                <span title="${escapeXml(app.value)}"><span aria-hidden="true">${app.type === 'aumid' ? '📦 ' : '📄 '}</span>${escapeXml(truncate(app.value, 60))}</span>
                <div class="pin-actions" style="margin-top: 6px;">
                    <button type="button" class="btn-icon btn-small" data-action="pinAllowedToStart" data-arg="${i}" aria-label="Pin to Start">
                        <span aria-hidden="true">Start</span>
                    </button>
                    <button type="button" class="btn-icon btn-small" data-action="pinAllowedToTaskbar" data-arg="${i}" aria-label="Pin to Taskbar">
                        <span aria-hidden="true">Taskbar</span>
                    </button>
                    <button type="button" class="btn-icon btn-small" data-action="addAllowedEdgeTile" data-arg="${i}" aria-label="Add Edge site tile" ${isEdge ? '' : 'disabled'}>
                        <span aria-hidden="true">Edge Tile</span>
                    </button>
                </div>
            </div>
            <button type="button" class="remove-btn" data-action="removeApp" data-arg="${i}" aria-label="Remove ${escapeXml(truncate(app.value, 30))}">
                <span aria-hidden="true">✕</span>
            </button>
        </div>
    `;
    }).join('');
}

/* ============================================================================
   Start Pins Management (Multi-App Mode)
   ============================================================================ */
function addPin() {
    const name = dom.get('pinName').value.trim();
    const target = dom.get('pinTarget').value.trim();
    const args = dom.get('pinArgs').value.trim();
    const workingDir = dom.get('pinWorkingDir').value.trim();
    const iconPath = dom.get('pinIconPath').value.trim();

    if (!name || !target) {
        alert('Shortcut Name and Target Path are required.');
        return;
    }

    // Check if a pin with the same name already exists
    if (state.startPins.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('A shortcut with this name already exists.');
        return;
    }

    state.startPins.push({
        name: name,
        pinType: 'desktopAppLink',  // Manual entries default to desktopAppLink
        target: target,
        args: args,
        workingDir: workingDir,
        iconPath: iconPath
    });

    // Clear the form
    dom.get('pinName').value = '';
    dom.get('pinTarget').value = '';
    dom.get('pinArgs').value = '';
    dom.get('pinWorkingDir').value = '';
    dom.get('pinIconPath').value = '';
    updateEdgeArgsVisibility('pin', 'pinTarget', 'pinEdgeArgsGroup');

    renderPinList();
    updatePreview();
}

function addEdgeSecondaryTile() {
    const name = dom.get('edgeTileName').value.trim();
    const url = getEdgeTileLaunchUrl();
    const tileId = dom.get('edgeTileId').value.trim();

    if (!name || !url) {
        alert('Edge tile name and URL/file path are required.');
        return;
    }

    if (state.startPins.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('A pin with this name already exists.');
        return;
    }

    state.startPins.push({
        name: name,
        pinType: 'secondaryTile',
        packagedAppId: 'Microsoft.MicrosoftEdge.Stable_8wekyb3d8bbwe!App',
        args: url,
        tileId: tileId || ''
    });

    dom.get('edgeTileName').value = '';
    dom.get('edgeTileUrl').value = '';
    dom.get('edgeTileFilePath').value = '';
    dom.get('edgeTileId').value = '';

    renderPinList();
    updatePreview();
}

function buildUniquePinName(baseName) {
    const trimmed = baseName.trim() || 'Edge Site';
    const existing = state.startPins.map(p => (p.name || '').toLowerCase());
    if (!existing.includes(trimmed.toLowerCase())) {
        return trimmed;
    }
    let counter = 2;
    let candidate = `${trimmed} (${counter})`;
    while (existing.includes(candidate.toLowerCase())) {
        counter += 1;
        candidate = `${trimmed} (${counter})`;
    }
    return candidate;
}

function duplicatePin(index) {
    const pin = state.startPins[index];
    if (!pin) return;

    let clone = null;
    if (pin.pinType === 'secondaryTile') {
        clone = {
            name: buildUniquePinName(`${pin.name || 'Edge Site'} Copy`),
            pinType: 'secondaryTile',
            packagedAppId: pin.packagedAppId || 'Microsoft.MicrosoftEdge.Stable_8wekyb3d8bbwe!App',
            args: pin.args || '',
            tileId: ''
        };
    } else if (pin.pinType === 'packagedAppId') {
        clone = {
            name: buildUniquePinName(`${pin.name || 'App'} Copy`),
            pinType: 'packagedAppId',
            packagedAppId: pin.packagedAppId || ''
        };
    } else {
        clone = {
            name: buildUniquePinName(`${pin.name || 'Shortcut'} Copy`),
            pinType: 'desktopAppLink',
            target: pin.target || '',
            args: pin.args || '',
            workingDir: pin.workingDir || '',
            iconPath: pin.iconPath || '',
            systemShortcut: pin.systemShortcut || ''
        };
    }

    state.startPins.push(clone);
    renderPinList();
    editPin(state.startPins.length - 1);
    updatePreview();
}

function buildPinNameFromApp(app) {
    if (!app || !app.value) return 'Unnamed';
    if (isEdgeApp(app.value)) return 'Microsoft Edge';
    if (app.type === 'aumid') return app.value;
    const parts = app.value.split('\\');
    return parts[parts.length - 1] || app.value;
}

function pinAllowedToStart(index) {
    const app = state.allowedApps[index];
    if (!app) return;

    if (app.type === 'aumid') {
        if (state.startPins.some(p => p.pinType === 'packagedAppId' && p.packagedAppId === app.value)) {
            alert('This app is already pinned to Start.');
            return;
        }
        state.startPins.push({
            name: buildPinNameFromApp(app),
            pinType: 'packagedAppId',
            packagedAppId: app.value
        });
    } else {
        if (state.startPins.some(p => p.pinType === 'desktopAppLink' && p.target === app.value)) {
            alert('This app is already pinned to Start.');
            return;
        }
        state.startPins.push({
            name: buildPinNameFromApp(app),
            pinType: 'desktopAppLink',
            target: app.value,
            args: '',
            workingDir: '',
            iconPath: ''
        });
    }

    renderPinList();
    updatePreview();
}

function pinAllowedToTaskbar(index) {
    const app = state.allowedApps[index];
    if (!app) return;

    if (app.type === 'aumid') {
        if (state.taskbarPins.some(p => p.pinType === 'packagedAppId' && p.packagedAppId === app.value)) {
            alert('This app is already pinned to the taskbar.');
            return;
        }
        state.taskbarPins.push({
            name: buildPinNameFromApp(app),
            pinType: 'packagedAppId',
            packagedAppId: app.value,
            systemShortcut: '',
            target: '',
            iconPath: ''
        });
    } else {
        if (state.taskbarPins.some(p => p.pinType === 'desktopAppLink' && p.target === app.value)) {
            alert('This app is already pinned to the taskbar.');
            return;
        }
        state.taskbarPins.push({
            name: buildPinNameFromApp(app),
            pinType: 'desktopAppLink',
            packagedAppId: '',
            systemShortcut: '',
            target: app.value,
            args: '',
            workingDir: '',
            iconPath: ''
        });
    }

    renderTaskbarPinList();
    updatePreview();
}

function addAllowedEdgeTile(index) {
    const app = state.allowedApps[index];
    if (!app) return;
    const isEdge = isEdgeApp(app.value) || app.value === 'Microsoft.MicrosoftEdge.Stable_8wekyb3d8bbwe!App';
    if (!isEdge) {
        alert('Edge site tiles require Microsoft Edge in the allowed apps list.');
        return;
    }

    ensureEdgeDependencies(app);

    const name = prompt('Tile name:', 'Edge Site');
    if (!name) return;
    const urlInput = prompt('URL or file path:', 'https://');
    const url = normalizeTileUrl(urlInput);
    if (!url) return;

    if (state.startPins.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('A pin with this name already exists.');
        return;
    }

    state.startPins.push({
        name: name,
        pinType: 'secondaryTile',
        packagedAppId: 'Microsoft.MicrosoftEdge.Stable_8wekyb3d8bbwe!App',
        args: url,
        tileId: ''
    });

    renderPinList();
    updatePreview();
}

function editPin(index) {
    const pin = state.startPins[index];
    if (!pin) return;
    editingPinIndex = index;

    dom.get('editPinName').value = pin.name || '';
    dom.get('editPinType').textContent = pin.pinType || 'desktopAppLink';

    dom.get('editDesktopFields').classList.toggle('hidden', pin.pinType !== 'desktopAppLink');
    dom.get('editPackagedFields').classList.toggle('hidden', pin.pinType !== 'packagedAppId');
    dom.get('editSecondaryFields').classList.toggle('hidden', pin.pinType !== 'secondaryTile');

    if (pin.pinType === 'desktopAppLink') {
        dom.get('editPinTarget').value = pin.target || '';
        dom.get('editPinArgs').value = pin.args || '';
        dom.get('editPinWorkingDir').value = pin.workingDir || '';
        dom.get('editPinIconPath').value = pin.iconPath || '';
        dom.get('editPinShortcutPath').value = pin.systemShortcut || '';
        updateEdgeArgsVisibility('editPin', 'editPinTarget', 'editPinEdgeArgsGroup');
        const editPresetSelect = dom.get('editPinTargetPreset');
        if (editPresetSelect) {
            editPresetSelect.value = '';
        }
    } else if (pin.pinType === 'packagedAppId') {
        dom.get('editPinPackagedAppId').value = pin.packagedAppId || '';
    } else if (pin.pinType === 'secondaryTile') {
        dom.get('editTileId').value = pin.tileId || '';
        dom.get('editTileUrl').value = pin.args || '';
        dom.get('editTilePackagedAppId').value = pin.packagedAppId || 'Microsoft.MicrosoftEdge.Stable_8wekyb3d8bbwe!App';
    }

    dom.get('pinEditPanel').classList.remove('hidden');
}

function cancelEditPin() {
    editingPinIndex = null;
    dom.get('pinEditPanel').classList.add('hidden');
}

function saveEditPin() {
    if (editingPinIndex === null) return;
    const pin = state.startPins[editingPinIndex];
    if (!pin) return;

    const name = dom.get('editPinName').value.trim();
    if (!name) {
        alert('Pin name is required.');
        return;
    }

    pin.name = name;

    if (pin.pinType === 'desktopAppLink') {
        pin.target = dom.get('editPinTarget').value.trim();
        pin.args = dom.get('editPinArgs').value.trim();
        pin.workingDir = dom.get('editPinWorkingDir').value.trim();
        pin.iconPath = dom.get('editPinIconPath').value.trim();
        pin.systemShortcut = dom.get('editPinShortcutPath').value.trim();
    } else if (pin.pinType === 'packagedAppId') {
        pin.packagedAppId = dom.get('editPinPackagedAppId').value.trim();
    } else if (pin.pinType === 'secondaryTile') {
        pin.tileId = dom.get('editTileId').value.trim();
        const url = dom.get('editTileUrl').value.trim();
        if (!url) {
            alert('Tile URL or file path is required.');
            return;
        }
        pin.args = url;
        pin.packagedAppId = dom.get('editTilePackagedAppId').value.trim() || 'Microsoft.MicrosoftEdge.Stable_8wekyb3d8bbwe!App';
    }

    renderPinList();
    updatePreview();
    cancelEditPin();
}

function movePinUp(index) {
    if (index <= 0) return;
    const [pin] = state.startPins.splice(index, 1);
    state.startPins.splice(index - 1, 0, pin);
    renderPinList();
    updatePreview();
}

function movePinDown(index) {
    if (index >= state.startPins.length - 1) return;
    const [pin] = state.startPins.splice(index, 1);
    state.startPins.splice(index + 1, 0, pin);
    renderPinList();
    updatePreview();
}

function removePin(index) {
    state.startPins.splice(index, 1);
    renderPinList();
    updatePreview();
}

function renderPinList() {
    const list = dom.get('pinList');
    const count = dom.get('pinCount');

    count.textContent = state.startPins.length;

    if (state.startPins.length === 0) {
        list.innerHTML = '<div class="empty-list" role="status">No pins added yet</div>';
        return;
    }

    list.innerHTML = state.startPins.map((pin, i) => {
        const isUwp = pin.pinType === 'packagedAppId';
        const displayTarget = isUwp
            ? pin.packagedAppId
            : (pin.pinType === 'secondaryTile'
                ? (pin.args || pin.packagedAppId || 'Edge site tile')
                : (pin.target ? truncate(pin.target, 40)
                    : (pin.systemShortcut ? truncate(pin.systemShortcut, 40) : '(no target - click to edit)')));
        const hasArgs = pin.args ? ` (${truncate(pin.args, 20)})` : '';
        const missingTarget = !isUwp && pin.pinType === 'desktopAppLink' && !pin.target && !pin.systemShortcut;
        const warningStyle = missingTarget ? 'color: var(--error-color, #e74c3c);' : 'color: var(--text-secondary);';
    const typeLabel = isUwp ? '<span style="background: var(--accent); color: white; padding: 1px 4px; border-radius: 3px; font-size: 0.65rem; margin-left: 6px;">UWP</span>' : '';
    const linkBadge = pin.pinType === 'desktopAppLink'
        ? '<span style="background: var(--bg-tertiary); color: var(--text-secondary); padding: 1px 4px; border-radius: 3px; font-size: 0.65rem; margin-left: 6px;">.lnk</span>'
        : '';
    const edgeBadge = isEdgeBackedDesktopPin(pin)
        ? '<span style="background: var(--bg-tertiary); color: var(--text-secondary); padding: 1px 4px; border-radius: 3px; font-size: 0.65rem; margin-left: 4px;">Edge</span>'
        : '';
    const edgeWarning = shouldWarnEdgeShortcutPin(pin)
        ? '<span style="font-size: 0.7rem; color: var(--warning-color, #b26a00);">Note: Edge-backed shortcuts may show as \'Microsoft Edge\' with the Edge icon in Assigned Access; custom .lnk name/icon may be ignored.</span>'
        : '';
        return `
        <div class="app-item draggable" role="listitem" data-pin-list="start" data-index="${i}" draggable="true" style="${missingTarget ? 'border-left: 3px solid var(--error-color, #e74c3c);' : ''}">
            <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
                <span style="font-weight: 500;">${escapeXml(pin.name)}${typeLabel}${linkBadge}${edgeBadge}${missingTarget ? ' <span style="color: var(--error-color, #e74c3c);" title="Target path required">⚠</span>' : ''}</span>
                <span style="font-size: 0.75rem; ${warningStyle} overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeXml(displayTarget)}${escapeXml(hasArgs)}">${escapeXml(displayTarget)}${escapeXml(hasArgs)}</span>
                ${edgeWarning}
            </div>
            <div class="pin-actions">
                <button type="button" class="btn-icon btn-small" data-action="movePinUp" data-arg="${i}" aria-label="Move ${escapeXml(pin.name)} up" ${i === 0 ? 'disabled' : ''}>
                    <span aria-hidden="true">↑</span>
                </button>
                <button type="button" class="btn-icon btn-small" data-action="movePinDown" data-arg="${i}" aria-label="Move ${escapeXml(pin.name)} down" ${i === state.startPins.length - 1 ? 'disabled' : ''}>
                    <span aria-hidden="true">↓</span>
                </button>
                <button type="button" class="btn-icon btn-small" data-action="duplicatePin" data-arg="${i}" aria-label="Duplicate ${escapeXml(pin.name)}">
                    <span aria-hidden="true">⧉</span>
                </button>
                <button type="button" class="btn-icon btn-small" data-action="editPin" data-arg="${i}" aria-label="Edit ${escapeXml(pin.name)}">
                    <span aria-hidden="true">✎</span>
                </button>
                <button type="button" class="remove-btn" data-action="removePin" data-arg="${i}" aria-label="Remove ${escapeXml(pin.name)}">
                    <span aria-hidden="true">✕</span>
                </button>
            </div>
        </div>
    `}).join('');
}

function toggleExportSection(sectionId) {
    const section = dom.get(sectionId);
    if (!section) return;
    const isHidden = section.classList.contains('hidden');
    section.classList.toggle('hidden', !isHidden);
    section.setAttribute('aria-hidden', (!isHidden).toString());
    const toggle = document.querySelector(`[data-action="toggleExportSection"][data-arg="${sectionId}"]`);
    if (toggle) {
        toggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    }
}

function updateExportAvailability() {
    const startLayoutBtn = dom.get('downloadStartLayoutBtn');
    if (!startLayoutBtn) return;
    const show = state.mode === 'multi' || state.mode === 'restricted';
    startLayoutBtn.classList.toggle('hidden', !show);
    startLayoutBtn.setAttribute('aria-hidden', (!show).toString());
}

function updateExportDetectedGuidance() {
    const container = dom.get('exportDetectedGuidance');
    if (!container) return;
    const lines = [];
    if (hasDesktopAppLinks()) {
        lines.push('.lnk shortcuts detected — run Shortcut Creator if these shortcuts don’t already exist on the target device.');
    } else {
        lines.push('No .lnk shortcuts detected — Shortcut Creator is not required.');
    }
    if (hasEdgeBackedDesktopLinks()) {
        lines.push('Edge-backed shortcuts detected — Edge Manifest Workaround (Advanced) may help Windows honor .lnk icon/name metadata in Assigned Access.');
    }
    lines.push('If deploying via Intune OMA-URI, you typically do not need the Apply Assigned Access script.');
    container.innerHTML = lines.map(line => `<div>${escapeXml(line)}</div>`).join('');
}

function updateProgressRail() {
    const rail = document.querySelector('.progress-rail');
    if (!rail) return;

    const activeTab = document.querySelector('.side-nav-btn.active')?.id?.replace('tab-btn-', '') || 'setup';
    const steps = {
        setup: getSetupStatus(),
        apps: getAppsStatus(),
        pins: getPinsStatus(),
        system: 'optional',
        export: getExportStatus()
    };

    rail.querySelectorAll('.progress-step').forEach(step => {
        const key = step.getAttribute('data-step');
        const status = steps[key] || 'pending';
        step.classList.remove('complete', 'ready', 'optional', 'pending', 'current');
        step.classList.add(status);
        if (key === activeTab) {
            step.classList.add('current');
        }
    });
}

function getSetupStatus() {
    const profileId = dom.get('profileId').value.trim();
    const hasValidProfile = /^\{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}$/i.test(profileId);

    let hasAccount = false;
    if (state.accountType === 'auto') {
        hasAccount = Boolean(dom.get('displayName').value.trim());
    } else if (state.accountType === 'existing') {
        hasAccount = Boolean(dom.get('accountName').value.trim());
    } else if (state.accountType === 'group') {
        hasAccount = Boolean(dom.get('groupName').value.trim());
    } else if (state.accountType === 'global') {
        hasAccount = true;
    }

    return hasValidProfile && hasAccount ? 'complete' : 'pending';
}

function getAppsStatus() {
    if (state.mode === 'single') {
        const appType = dom.get('appType').value;
        if (appType === 'edge') {
            const sourceType = dom.get('edgeSourceType').value;
            const urlValue = dom.get('edgeUrl').value.trim();
            const fileValue = dom.get('edgeFilePath').value.trim();
            return (sourceType === 'url' ? urlValue : fileValue) ? 'complete' : 'pending';
        }
        if (appType === 'uwp') {
            return dom.get('uwpAumid').value.trim() ? 'complete' : 'pending';
        }
        if (appType === 'win32') {
            return dom.get('win32Path').value.trim() ? 'complete' : 'pending';
        }
    }
    return state.allowedApps.length > 0 ? 'complete' : 'pending';
}

function getPinsStatus() {
    if (state.mode === 'single') return 'optional';
    return state.startPins.length > 0 ? 'complete' : 'optional';
}

function getExportStatus() {
    const errors = validate();
    return errors.length === 0 ? 'ready' : 'pending';
}

/* ============================================================================
   Preview & Syntax Highlighting
   ============================================================================ */
function updatePreview() {
    const xml = generateXml();
    const edgeWarningPins = getEdgeShortcutWarningPins();
    const edgeWarningComment = edgeWarningPins.length > 0
        ? `# WARNING: Some Edge-backed shortcuts may not display custom name/icon in Assigned Access.\n# Affected pins: ${edgeWarningPins.join(', ')}\n\n`
        : '';
    dom.get('xmlPreview').textContent = xml;
    updateExportAvailability();
    updateExportDetectedGuidance();
    showValidation();
    updateProgressRail();
    updateSummary();
}

/* ============================================================================
   Export Functions
   ============================================================================ */
function copyXml() {
    if (!showValidation()) {
        if (!confirm('Configuration has errors. Copy anyway?')) return;
    }

    const xml = generateXml();
    copyToClipboard(xml);
    alert('XML copied to clipboard!');
}

function getConfigFileName(extension) {
    const configName = dom.get('configName').value.trim();
    if (configName) {
        // Sanitize: replace spaces with hyphens, remove invalid filename chars
        const sanitized = configName.replace(/\s+/g, '-').replace(/[<>:"/\\|?*]/g, '');
        return `AssignedAccess-${sanitized}.${extension}`;
    }
    return `AssignedAccessConfig.${extension}`;
}

function downloadXml() {
    if (!showValidation()) {
        if (!confirm('Configuration has errors. Download anyway?')) return;
    }

    const xml = generateXml();
    downloadFile(xml, getConfigFileName('xml'), 'application/xml');
}

function downloadPowerShell() {
    if (!showValidation()) {
        if (!confirm('Configuration has errors. Download anyway?')) return;
    }

    const xml = generateXml();

    // Generate shortcuts JSON for PowerShell
    // Exclude: UWP apps (packagedAppId - no .lnk needed), system shortcuts (already exist)
    const shortcutsJson = JSON.stringify(state.startPins
        .concat(state.taskbarPins || [])
        .filter(p => p.pinType !== 'packagedAppId' && !p.systemShortcut)
        .map(p => ({
            Name: p.name || '',
            TargetPath: p.target || '',
            Arguments: p.args || '',
            WorkingDirectory: p.workingDir || '',
            IconLocation: p.iconPath || ''
        })), null, 4);

    const ps1 = `#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Applies AssignedAccess (Kiosk) configuration to the local device.
.DESCRIPTION
    This script must be run as SYSTEM. Use PsExec:
    psexec.exe -i -s powershell.exe -ExecutionPolicy Bypass -File "AssignedAccess-<Config>.ps1"
.NOTES
    Generated by AssignedAccess XML Builder
    Reboot required after applying.
    Creates an NDJSON log file in %ProgramData%\\AssignedAccessXMLBuilder\\Logs.
    If Windows blocks the script, right-click the .ps1 file, choose Properties, then Unblock.
#>

$ErrorActionPreference = "Stop"

# Initialize logging
$scriptName = "AAXB-Apply-AssignedAccess"
$logDir = Join-Path $env:ProgramData "AssignedAccessXMLBuilder\\Logs"
if (-not (Test-Path $logDir)) {
    try { New-Item -ItemType Directory -Path $logDir -Force | Out-Null } catch { }
}
$logFile = Join-Path $logDir ($scriptName + "_" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".log")
$log = @{
    startTime = (Get-Date).ToString("o")
    computerName = $env:COMPUTERNAME
    userName = $env:USERNAME
    windowsVersion = [System.Environment]::OSVersion.Version.ToString()
    windowsBuild = (Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion").DisplayVersion
    windowsEdition = $null
    executionContext = $null
    preFlightPassed = $false
    steps = @()
    success = $false
    xmlLength = $null
    endTime = $null
}

function Write-Log {
    param([string]$Action, [string]$Status, [string]$Message = "", [hashtable]$Data = $null)
    $entry = @{
        timestamp = (Get-Date).ToString("o")
        level = $Status
        script = $scriptName
        event = $Action
        message = $Message
    }
    if ($Data) { $entry.data = $Data }
    $log.steps += $entry

    $color = switch ($Status) {
        "Success" { "Green" }
        "Warning" { "Yellow" }
        "Error" { "Red" }
        default { "Cyan" }
    }
    Write-Host "[$Status] $Action" -ForegroundColor $color
    if ($Message) { Write-Host "    $Message" -ForegroundColor Gray }
    try {
        ($entry | ConvertTo-Json -Compress) | Out-File -FilePath $logFile -Append -Encoding UTF8
    } catch { }
}

function Save-Log {
    $log.endTime = (Get-Date).ToString("o")
    Write-Log -Action "Log saved" -Status "Info" -Message $logFile
}

# Start Menu Shortcuts to create (JSON parsed at runtime)
$shortcutsJson = @'
${shortcutsJson}
'@
$shortcuts = @()
if ($shortcutsJson.Trim() -ne '[]' -and $shortcutsJson.Trim() -ne '') {
    try {
        $parsed = $shortcutsJson | ConvertFrom-Json
        # Ensure it's always an array (single object needs wrapping)
        if ($null -ne $parsed) {
            if ($parsed -is [System.Array]) {
                $shortcuts = $parsed
            } else {
                $shortcuts = @($parsed)
            }
        }
    } catch {
        Write-Log -Action "Parse shortcuts JSON" -Status "Warning" -Message $_.Exception.Message
    }
}

# Function to create shortcuts
function New-Shortcut {
    param(
        [string]$Name,
        [string]$TargetPath,
        [string]$Arguments,
        [string]$WorkingDirectory,
        [string]$IconLocation
    )

    $shortcutDir = Join-Path $env:ALLUSERSPROFILE "Microsoft\\Windows\\Start Menu\\Programs"
    if (-not (Test-Path $shortcutDir)) {
        New-Item -ItemType Directory -Path $shortcutDir -Force | Out-Null
    }

    $shortcutPath = Join-Path $shortcutDir "$Name.lnk"

    # Expand environment variables in paths
    $expandedTarget = [Environment]::ExpandEnvironmentVariables($TargetPath)

    $WshShell = New-Object -ComObject WScript.Shell
    $shortcut = $WshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $expandedTarget

    if ($Arguments) {
        $shortcut.Arguments = $Arguments
    }
    if ($WorkingDirectory) {
        $shortcut.WorkingDirectory = $WorkingDirectory
    }
    if ($IconLocation) {
        $shortcut.IconLocation = $IconLocation
    }

    $shortcut.Save()

    return $shortcutPath
}

# AssignedAccess Configuration XML
$xml = @'
${xml}
'@

Write-Log -Action "Script start" -Status "Info" -Message "AssignedAccess Deploy Script"
Write-Log -Action "Pre-flight checks" -Status "Info"

# Check 1: Windows Edition
$edition = (Get-WindowsEdition -Online).Edition
$log.windowsEdition = $edition
$supportedEditions = @("Pro", "Enterprise", "Education", "IoTEnterprise", "IoTEnterpriseS", "ServerRdsh")
$isSupported = $supportedEditions | Where-Object { $edition -like "*$_*" }
if (-not $isSupported) {
    Write-Log -Action "Windows Edition Check" -Status "Error" -Message "Unsupported edition: $edition. AssignedAccess requires Enterprise, Education, or IoT Enterprise."
    Save-Log
    exit 1
}
Write-Log -Action "Windows Edition Check" -Status "Success" -Message $edition

# Check 2: Running as SYSTEM (use SID check for localization support)
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$log.executionContext = $currentUser.Name
$isSystem = $currentUser.User.Value -eq "S-1-5-18"
if (-not $isSystem) {
    Write-Log -Action "SYSTEM Context Check" -Status "Error" -Message "Running as: $($currentUser.Name). Must run as SYSTEM. Use: psexec.exe -i -s powershell.exe -ExecutionPolicy Bypass -File \`"$PSCommandPath\`""
    Save-Log
    exit 1
}
Write-Log -Action "SYSTEM Context Check" -Status "Success"

# Check 3: MDM_AssignedAccess WMI instance exists
$obj = Get-CimInstance -Namespace "root\\cimv2\\mdm\\dmmap" -ClassName "MDM_AssignedAccess" -ErrorAction SilentlyContinue
if ($null -eq $obj) {
    Write-Log -Action "MDM_AssignedAccess WMI Check" -Status "Error" -Message "WMI instance not found. This may indicate an unsupported Windows configuration or WMI corruption."
    Save-Log
    exit 1
}
Write-Log -Action "MDM_AssignedAccess WMI Check" -Status "Success"

$log.preFlightPassed = $true
Write-Log -Action "Pre-flight checks passed" -Status "Success" -Message "Proceeding with deployment"

try {
    Write-Log -Action "Starting deployment" -Status "Info" -Message "Target: $env:COMPUTERNAME"

    # Create Start Menu shortcuts
    if ($shortcuts.Count -gt 0) {
        Write-Log -Action "Creating Start Menu shortcuts" -Status "Info" -Message "$($shortcuts.Count) shortcut(s) to create"
        foreach ($sc in $shortcuts) {
            # Skip shortcuts with empty name or target
            if ([string]::IsNullOrWhiteSpace($sc.Name) -or [string]::IsNullOrWhiteSpace($sc.TargetPath)) {
                Write-Log -Action "Skipped shortcut" -Status "Warning" -Message "Missing name or target path"
                continue
            }
            try {
                $path = New-Shortcut -Name $sc.Name -TargetPath $sc.TargetPath -Arguments $sc.Arguments -WorkingDirectory $sc.WorkingDirectory -IconLocation $sc.IconLocation
                Write-Log -Action "Created shortcut" -Status "Success" -Message $path
            }
            catch {
                Write-Log -Action "Failed to create shortcut" -Status "Warning" -Message "$($sc.Name): $($_.Exception.Message)"
            }
        }
    } else {
        Write-Log -Action "Creating Start Menu shortcuts" -Status "Info" -Message "No shortcuts to create"
    }

    # HTML encode the XML and apply
    Write-Log -Action "Encoding XML configuration" -Status "Info"
    $log.xmlLength = $xml.Length
    $encodedXml = [System.Net.WebUtility]::HtmlEncode($xml)
    Write-Log -Action "XML encoded" -Status "Success" -Message "Original: $($xml.Length) chars, Encoded: $($encodedXml.Length) chars"

    Write-Log -Action "Applying configuration" -Status "Info"
    $obj.Configuration = $encodedXml
    Set-CimInstance -CimInstance $obj -ErrorAction Stop
    Write-Log -Action "Configuration applied" -Status "Success"

    $log.success = $true
    Save-Log

    Write-Log -Action "Deployment complete" -Status "Success" -Message "AssignedAccess configuration applied"
    Write-Log -Action "Reboot required" -Status "Warning" -Message "Changes take effect after reboot"

    Write-Log -Action "Reboot prompt" -Status "Info" -Message "Prompting to reboot"
    $reboot = Read-Host "Reboot now? (Y/N)"
    if ($reboot -eq 'Y' -or $reboot -eq 'y') {
        Write-Log -Action "User initiated reboot" -Status "Info"
        Save-Log
        Restart-Computer -Force
    } else {
        Write-Log -Action "Reboot skipped" -Status "Info"
        Save-Log
    }
}
catch {
    Write-Log -Action "Deployment failed" -Status "Error" -Message $_.Exception.Message
    Write-Log -Action "Troubleshooting" -Status "Info" -Message "Common causes: Invalid XML configuration; Referenced user account does not exist; Referenced app is not installed."
    Save-Log
    exit 1
}
`;

    downloadFile(ps1, getConfigFileName('ps1'), 'text/plain');

    // Also download the README summary
    const readme = generateReadme();
    setTimeout(() => {
        downloadFile(readme, getConfigFileName('md'), 'text/markdown');
    }, 100);
}

function downloadShortcutsScript() {
    if (!showValidation()) {
        if (!confirm('Configuration has errors. Download anyway?')) return;
    }

    const edgeWarningPins = getEdgeShortcutWarningPins();
    const edgeWarningComment = edgeWarningPins.length > 0
        ? `# WARNING: Some Edge-backed shortcuts may not display custom name/icon in Assigned Access.\n# Affected pins: ${edgeWarningPins.join(', ')}\n\n`
        : '';

    // Generate shortcuts JSON for PowerShell
    // Exclude: UWP apps (packagedAppId - no .lnk needed), system shortcuts (already exist)
    const shortcutsJson = JSON.stringify(state.startPins
        .concat(state.taskbarPins || [])
        .filter(p => p.pinType !== 'packagedAppId' && !p.systemShortcut)
        .map(p => ({
            Name: p.name || '',
            TargetPath: p.target || '',
            Arguments: p.args || '',
            WorkingDirectory: p.workingDir || '',
            IconLocation: p.iconPath || ''
        })), null, 4);

    const ps1 = `#Requires -RunAsAdministrator
${edgeWarningComment}<#
${edgeWarningComment}<#
<#
.SYNOPSIS
    Creates Start Menu shortcuts required by AssignedAccess StartPins.
.DESCRIPTION
    This script creates .lnk files under the Start Menu Programs folder.
    Use when deploying XML via Intune/OMA-URI and you only need shortcuts.
.NOTES
    Generated by AssignedAccess XML Builder
    If Windows blocks the script, right-click the .ps1 file, choose Properties, then Unblock.
#>

$ErrorActionPreference = "Stop"

# Initialize logging
$scriptName = "AAXB-Shortcut-Creator"
$logDir = Join-Path $env:ProgramData "AssignedAccessXMLBuilder\\Logs"
if (-not (Test-Path $logDir)) {
    try { New-Item -ItemType Directory -Path $logDir -Force | Out-Null } catch { }
}
$logFile = Join-Path $logDir ($scriptName + "_" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".log")

function Write-Log {
    param(
        [string]$Level,
        [string]$Event,
        [string]$Message,
        [hashtable]$Data = $null
    )
    $entry = @{
        timestamp = (Get-Date).ToString("o")
        level = $Level
        script = $scriptName
        event = $Event
        message = $Message
    }
    if ($Data) { $entry.data = $Data }
    try {
        ($entry | ConvertTo-Json -Compress) | Out-File -FilePath $logFile -Append -Encoding UTF8
    } catch { }
}

Write-Log -Level "INFO" -Event "Script start" -Message "Shortcut Creator started"

# Start Menu Shortcuts to create (JSON parsed at runtime)
$shortcutsJson = @'
${shortcutsJson}
'@
$shortcuts = @()
if ($shortcutsJson.Trim() -ne '[]' -and $shortcutsJson.Trim() -ne '') {
    try {
        $parsed = $shortcutsJson | ConvertFrom-Json
        # Ensure it's always an array (single object needs wrapping)
        if ($null -ne $parsed) {
            if ($parsed -is [System.Array]) {
                $shortcuts = $parsed
            } else {
                $shortcuts = @($parsed)
            }
        }
    } catch {
        Write-Log -Level "WARN" -Event "parse_shortcuts_json" -Message $_.Exception.Message
    }
}

function New-Shortcut {
    param(
        [string]$Name,
        [string]$TargetPath,
        [string]$Arguments,
        [string]$WorkingDirectory,
        [string]$IconLocation
    )

    $shortcutDir = Join-Path $env:ALLUSERSPROFILE "Microsoft\\Windows\\Start Menu\\Programs"
    if (-not (Test-Path $shortcutDir)) {
        New-Item -ItemType Directory -Path $shortcutDir -Force | Out-Null
    }

    $shortcutPath = Join-Path $shortcutDir "$Name.lnk"

    # Expand environment variables in paths
    $expandedTarget = [Environment]::ExpandEnvironmentVariables($TargetPath)

    $WshShell = New-Object -ComObject WScript.Shell
    $shortcut = $WshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $expandedTarget

    if ($Arguments) {
        $shortcut.Arguments = $Arguments
    }
    if ($WorkingDirectory) {
        $shortcut.WorkingDirectory = $WorkingDirectory
    }
    if ($IconLocation) {
        $shortcut.IconLocation = $IconLocation
    }

    $shortcut.Save()

    return $shortcutPath
}

if ($shortcuts.Count -eq 0) {
    Write-Host "No shortcuts to create." -ForegroundColor Yellow
    Write-Log -Level "WARN" -Event "no_shortcuts" -Message "No shortcuts to create."
    exit 0
}

Write-Host "Creating Start Menu shortcuts..." -ForegroundColor Cyan
Write-Log -Level "INFO" -Event "create_shortcuts" -Message "Creating Start Menu shortcuts" -Data @{ count = $shortcuts.Count }
foreach ($sc in $shortcuts) {
    if ([string]::IsNullOrWhiteSpace($sc.Name) -or [string]::IsNullOrWhiteSpace($sc.TargetPath)) {
        Write-Host "[WARN] Skipped shortcut with missing name or target." -ForegroundColor Yellow
        Write-Log -Level "WARN" -Event "skip_shortcut" -Message "Skipped shortcut with missing name or target." -Data @{ name = $sc.Name; target = $sc.TargetPath }
        continue
    }
    try {
        $path = New-Shortcut -Name $sc.Name -TargetPath $sc.TargetPath -Arguments $sc.Arguments -WorkingDirectory $sc.WorkingDirectory -IconLocation $sc.IconLocation
        Write-Host "[OK] Created: $($sc.Name) -> $path" -ForegroundColor Green
        Write-Log -Level "INFO" -Event "shortcut_created" -Message "Created shortcut" -Data @{ name = $sc.Name; path = $path }
    }
    catch {
        Write-Host "[WARN] Failed to create: $($sc.Name) - $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Log -Level "ERROR" -Event "shortcut_failed" -Message $_.Exception.Message -Data @{ name = $sc.Name }
    }
}
Write-Log -Level "INFO" -Event "complete" -Message "Shortcut Creator complete"
`;

    const configName = dom.get('configName').value.trim();
    const suffix = configName ? configName.replace(/\s+/g, '-').replace(/[<>:"/\\|?*]/g, '') : 'Config';
    downloadFile(ps1, `CreateShortcuts_${suffix}.ps1`, 'text/plain');
}

function downloadEdgeManifestWorkaround() {
    const installScript = `#Requires -RunAsAdministrator
[CmdletBinding()]
param()

$scriptName = "AAXB-EdgeVisualElements-Install"

function Write-Log {
    param(
        [string]$Level,
        [string]$Event,
        [string]$Message,
        [hashtable]$Data = $null
    )
    try {
        $logDir = Join-Path $env:ProgramData "AssignedAccessXMLBuilder\\Logs"
        if (-not (Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
        if (-not $script:LogPath) {
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $script:LogPath = Join-Path $logDir ($scriptName + "_" + $timestamp + ".log")
        }
        $entry = @{
            timestamp = (Get-Date).ToString("o")
            level = $Level
            script = $scriptName
            event = $Event
            message = $Message
        }
        if ($Data) {
            $entry.data = $Data
        }
        ($entry | ConvertTo-Json -Compress) | Out-File -FilePath $script:LogPath -Append -Encoding UTF8
    } catch {
        # Logging must never block execution
    }
}

function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-ManifestPaths {
    $paths = @()
    $pf = $env:ProgramFiles
    $pfx86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
    if ($pf) {
        $paths += (Join-Path $pf "Microsoft\\Edge\\Application\\msedge.VisualElementsManifest.xml")
    }
    if ($pfx86) {
        $paths += (Join-Path $pfx86 "Microsoft\\Edge\\Application\\msedge.VisualElementsManifest.xml")
    }
    return $paths | Select-Object -Unique
}

function Get-RecreatedFiles {
    param([string]$Directory)
    if (-not (Test-Path $Directory)) { return @() }
    Get-ChildItem -Path $Directory -Filter "msedge.VisualElementsManifest.xml.aaxb.recreated.*" -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending
}

function Trim-RecreatedFiles {
    param([string]$Directory)
    $files = Get-RecreatedFiles -Directory $Directory
    if ($files.Count -le 5) { return }
    $files | Select-Object -Skip 5 | ForEach-Object {
        try {
            Remove-Item $_.FullName -Force -ErrorAction Stop
            Write-Log -Level "INFO" -Event "cleanup_recreated" -Message "Removed old recreated file" -Data @{ path = $_.FullName }
        } catch {
            Write-Log -Level "WARN" -Event "cleanup_recreated_failed" -Message $_.Exception.Message -Data @{ path = $_.FullName }
        }
    }
}

function Apply-ManifestRename {
    param([string]$ManifestPath)
    $dir = Split-Path $ManifestPath -Parent
    $backup = Join-Path $dir "msedge.VisualElementsManifest.xml.aaxb.bak"
    if (Test-Path $ManifestPath) {
        if (-not (Test-Path $backup)) {
            try {
                Rename-Item -Path $ManifestPath -NewName $backup -ErrorAction Stop
                Write-Log -Level "INFO" -Event "backup_created" -Message "Renamed live manifest to backup" -Data @{ path = $ManifestPath; backup = $backup }
            } catch {
                Write-Log -Level "ERROR" -Event "backup_failed" -Message $_.Exception.Message -Data @{ path = $ManifestPath; backup = $backup }
            }
        } else {
            $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $recreated = Join-Path $dir ("msedge.VisualElementsManifest.xml.aaxb.recreated." + $stamp)
            try {
                Rename-Item -Path $ManifestPath -NewName $recreated -ErrorAction Stop
                Write-Log -Level "WARN" -Event "live_manifest_recreated" -Message "Live manifest renamed because backup already exists" -Data @{ path = $ManifestPath; recreated = $recreated }
            } catch {
                Write-Log -Level "ERROR" -Event "recreated_rename_failed" -Message $_.Exception.Message -Data @{ path = $ManifestPath; recreated = $recreated }
            }
            Trim-RecreatedFiles -Directory $dir
        }
    } else {
        Write-Log -Level "INFO" -Event "manifest_missing" -Message "Manifest not found; nothing to rename" -Data @{ path = $ManifestPath }
    }
}

function Register-StartupTask {
    $taskName = "AssignedAccessXMLBuilder-EdgeVisualElements"
    $scriptPath = $MyInvocation.MyCommand.Path
    if (-not $scriptPath) {
        Write-Log -Level "ERROR" -Event "task_register_failed" -Message "Cannot resolve script path for scheduled task"
        return
    }
    $argument = '-NoProfile -ExecutionPolicy Bypass -File "' + $scriptPath + '"'
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument $argument
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -Compatibility Win8 -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    try {
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
        Write-Log -Level "INFO" -Event "task_registered" -Message "Scheduled task registered/updated" -Data @{ task = $taskName }
    } catch {
        Write-Log -Level "ERROR" -Event "task_register_failed" -Message $_.Exception.Message -Data @{ task = $taskName }
    }
}

if (-not (Test-Admin)) {
    Write-Log -Level "ERROR" -Event "admin_required" -Message "Administrator privileges are required."
    exit 1
}

$osCaption = (Get-CimInstance Win32_OperatingSystem).Caption
if ($osCaption -notmatch "Windows 11") {
    Write-Log -Level "WARN" -Event "os_check" -Message "This script is intended for Windows 11; continuing anyway." -Data @{ caption = $osCaption }
} else {
    Write-Log -Level "INFO" -Event "os_check" -Message "Windows 11 detected." -Data @{ caption = $osCaption }
}

$paths = Get-ManifestPaths
foreach ($path in $paths) {
    Apply-ManifestRename -ManifestPath $path
}

Register-StartupTask
Write-Log -Level "INFO" -Event "complete" -Message "Edge VisualElements workaround applied."
`;

    const removeScript = `#Requires -RunAsAdministrator
[CmdletBinding()]
param(
    [switch]$CleanupRecreatedFiles
)

$scriptName = "AAXB-EdgeVisualElements-Remove"

function Write-Log {
    param(
        [string]$Level,
        [string]$Event,
        [string]$Message,
        [hashtable]$Data = $null
    )
    try {
        $logDir = Join-Path $env:ProgramData "AssignedAccessXMLBuilder\\Logs"
        if (-not (Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
        if (-not $script:LogPath) {
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            $script:LogPath = Join-Path $logDir ($scriptName + "_" + $timestamp + ".log")
        }
        $entry = @{
            timestamp = (Get-Date).ToString("o")
            level = $Level
            script = $scriptName
            event = $Event
            message = $Message
        }
        if ($Data) {
            $entry.data = $Data
        }
        ($entry | ConvertTo-Json -Compress) | Out-File -FilePath $script:LogPath -Append -Encoding UTF8
    } catch {
        # Logging must never block execution
    }
}

function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-ManifestPaths {
    $paths = @()
    $pf = $env:ProgramFiles
    $pfx86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
    if ($pf) {
        $paths += (Join-Path $pf "Microsoft\\Edge\\Application\\msedge.VisualElementsManifest.xml")
    }
    if ($pfx86) {
        $paths += (Join-Path $pfx86 "Microsoft\\Edge\\Application\\msedge.VisualElementsManifest.xml")
    }
    return $paths | Select-Object -Unique
}

function Cleanup-Recreated {
    param([string]$Directory)
    if (-not (Test-Path $Directory)) { return }
    Get-ChildItem -Path $Directory -Filter "msedge.VisualElementsManifest.xml.aaxb.recreated.*" -File -ErrorAction SilentlyContinue |
        ForEach-Object {
            try {
                Remove-Item $_.FullName -Force -ErrorAction Stop
                Write-Log -Level "INFO" -Event "cleanup_recreated" -Message "Removed recreated file" -Data @{ path = $_.FullName }
            } catch {
                Write-Log -Level "WARN" -Event "cleanup_recreated_failed" -Message $_.Exception.Message -Data @{ path = $_.FullName }
            }
        }
}

if (-not (Test-Admin)) {
    Write-Log -Level "ERROR" -Event "admin_required" -Message "Administrator privileges are required."
    exit 1
}

$taskName = "AssignedAccessXMLBuilder-EdgeVisualElements"
try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction Stop
    Write-Log -Level "INFO" -Event "task_removed" -Message "Scheduled task removed" -Data @{ task = $taskName }
} catch {
    Write-Log -Level "WARN" -Event "task_remove_failed" -Message $_.Exception.Message -Data @{ task = $taskName }
}

$paths = Get-ManifestPaths
foreach ($path in $paths) {
    $dir = Split-Path $path -Parent
    $backup = Join-Path $dir "msedge.VisualElementsManifest.xml.aaxb.bak"
    if ((Test-Path $backup) -and -not (Test-Path $path)) {
        try {
            Rename-Item -Path $backup -NewName $path -ErrorAction Stop
            Write-Log -Level "INFO" -Event "restore_backup" -Message "Restored backup manifest" -Data @{ backup = $backup; path = $path }
        } catch {
            Write-Log -Level "ERROR" -Event "restore_failed" -Message $_.Exception.Message -Data @{ backup = $backup; path = $path }
        }
    } elseif ((Test-Path $backup) -and (Test-Path $path)) {
        Write-Log -Level "WARN" -Event "restore_skipped" -Message "Both live manifest and backup exist; no overwrite performed." -Data @{ backup = $backup; path = $path }
    } else {
        Write-Log -Level "INFO" -Event "backup_missing" -Message "Backup manifest not found; nothing to restore." -Data @{ backup = $backup; path = $path }
    }

    if ($CleanupRecreatedFiles) {
        Cleanup-Recreated -Directory $dir
    }
}

Write-Log -Level "INFO" -Event "complete" -Message "Edge VisualElements workaround removed."
`;

    const readme = `Assigned Access XML Builder (AAXB)
Author: Joshua Walderbach

Edge VisualElements Workaround (Advanced / Unsupported)

What this does:
- Renames Edge's Visual Elements manifest file (msedge.VisualElementsManifest.xml) so
  Assigned Access shortcuts are less likely to be forced into Edge's default name/icon.
- Installs a scheduled task that reapplies the rename at startup (to handle Edge updates).

Important:
- This workaround is NOT supported or documented by Microsoft.
- Edge updates may restore or replace the manifest at any time.
- Use only on managed kiosk devices where you control Edge updates.

How to install:
1) Run AAXB-EdgeVisualElements-Install.ps1 as Administrator.

How to remove:
1) Run AAXB-EdgeVisualElements-Remove.ps1 as Administrator.
   Optional: add -CleanupRecreatedFiles to delete recreated manifest files.

Logging:
- Logs are written to: %ProgramData%\\AssignedAccessXMLBuilder\\Logs
- Filename format: <scriptname>_<yyyyMMdd-HHmmss>.log
- Log format: NDJSON (one JSON object per line)
`;

    downloadFile(installScript, 'AAXB-EdgeVisualElements-Install.ps1', 'text/plain');
    setTimeout(() => {
        downloadFile(removeScript, 'AAXB-EdgeVisualElements-Remove.ps1', 'text/plain');
    }, 100);
    setTimeout(() => {
        downloadFile(readme, 'AAXB-EdgeVisualElements-Readme.txt', 'text/plain');
    }, 200);
}

function downloadStartLayoutXml() {
    if (!showValidation()) {
        if (!confirm('Configuration has errors. Download anyway?')) return;
    }

    const layoutXml = buildStartLayoutXml();
    if (!layoutXml) {
        if (!confirm('No Start menu pins configured. Download empty Start layout anyway?')) return;
    }

    const content = layoutXml || `<?xml version="1.0" encoding="utf-8"?>\n` +
        `<LayoutModificationTemplate Version="1"\n` +
        `    xmlns="http://schemas.microsoft.com/Start/2014/LayoutModification"\n` +
        `    xmlns:defaultlayout="http://schemas.microsoft.com/Start/2014/FullDefaultLayout"\n` +
        `    xmlns:start="http://schemas.microsoft.com/Start/2014/StartLayout">\n` +
        `    <LayoutOptions StartTileGroupCellWidth="6"/>\n` +
        `    <DefaultLayoutOverride>\n` +
        `        <StartLayoutCollection>\n` +
        `            <defaultlayout:StartLayout GroupCellWidth="6">\n` +
        `                <start:Group Name="Kiosk"/>\n` +
        `            </defaultlayout:StartLayout>\n` +
        `        </StartLayoutCollection>\n` +
        `    </DefaultLayoutOverride>\n` +
        `</LayoutModificationTemplate>`;

    const configName = dom.get('configName').value.trim();
    const suffix = configName ? configName.replace(/\s+/g, '-').replace(/[<>:"/\\|?*]/g, '') : 'Config';
    downloadFile(content, `StartLayout_${suffix}.xml`, 'application/xml');
}

/* ============================================================================
   Config Save / Load
   ============================================================================ */
const CONFIG_SCHEMA_VERSION = 1;
let configFileHandle = null;

function getConfigSaveName() {
    const configName = dom.get('configName').value.trim();
    if (configName) {
        const sanitized = configName.replace(/\s+/g, '-').replace(/[<>:"/\\|?*]/g, '');
        return `AssignedAccess-${sanitized}.aaxb.json`;
    }
    return 'AssignedAccessConfig.aaxb.json';
}

function collectFormValues() {
    const values = {};
    document.querySelectorAll('input, select, textarea').forEach(el => {
        if (!el.id || el.type === 'file') return;
        if (el.dataset && el.dataset.configSkip === 'true') return;
        if (el.type === 'checkbox') {
            values[el.id] = !!el.checked;
            return;
        }
        if (el.type === 'radio') {
            values[el.id] = !!el.checked;
            return;
        }
        values[el.id] = el.value;
    });
    return values;
}

function buildConfigSnapshot() {
    return {
        schemaVersion: CONFIG_SCHEMA_VERSION,
        name: dom.get('configName').value.trim() || 'Unnamed',
        savedAt: new Date().toISOString(),
        payload: {
            state: {
                mode: state.mode,
                accountType: state.accountType,
                allowedApps: state.allowedApps,
                startPins: state.startPins,
                taskbarPins: state.taskbarPins,
                autoLaunchApp: state.autoLaunchApp
            },
            formValues: collectFormValues()
        }
    };
}

async function writeConfigToHandle(handle, config) {
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(config, null, 2));
    await writable.close();
}

async function saveConfig() {
    const config = buildConfigSnapshot();
    if ('showSaveFilePicker' in window) {
        if (configFileHandle) {
            try {
                await writeConfigToHandle(configFileHandle, config);
                alert('Configuration saved.');
                return;
            } catch (e) {
                console.error('Failed to save configuration:', e);
                alert('Could not save configuration.');
                return;
            }
        }
        await saveConfigAs(config);
        return;
    }

    downloadFile(JSON.stringify(config, null, 2), getConfigSaveName(), 'application/json');
}

async function saveConfigAs(existingConfig) {
    const config = existingConfig || buildConfigSnapshot();
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: getConfigSaveName(),
                types: [{
                    description: 'AssignedAccess Builder Config',
                    accept: { 'application/json': ['.aaxb.json', '.json'] }
                }]
            });
            if (!handle) return;
            await writeConfigToHandle(handle, config);
            configFileHandle = handle;
            alert('Configuration saved.');
            return;
        } catch (e) {
            if (e && e.name === 'AbortError') return;
            console.error('Failed to save configuration:', e);
            alert('Could not save configuration.');
            return;
        }
    }

    downloadFile(JSON.stringify(config, null, 2), getConfigSaveName(), 'application/json');
}

async function loadConfig() {
    if ('showOpenFilePicker' in window) {
        try {
            const [handle] = await window.showOpenFilePicker({
                multiple: false,
                types: [{
                    description: 'AssignedAccess Builder Config',
                    accept: { 'application/json': ['.aaxb.json', '.json'] }
                }]
            });
            if (!handle) return;
            const file = await handle.getFile();
            await loadConfigFile(file, handle);
            return;
        } catch (e) {
            if (e && e.name === 'AbortError') return;
            console.error('Failed to open configuration:', e);
            alert('Could not open configuration.');
            return;
        }
    }

    dom.get('configImportInput').click();
}

function normalizeConfigPayload(config) {
    if (!config || typeof config !== 'object') {
        return { ok: false, error: 'Invalid configuration file.' };
    }
    if (config.schemaVersion && config.schemaVersion !== CONFIG_SCHEMA_VERSION) {
        return { ok: false, error: `Unsupported schema version: ${config.schemaVersion}` };
    }
    const payload = config.payload;
    if (!payload || typeof payload !== 'object') {
        return { ok: false, error: 'Configuration payload missing.' };
    }
    const savedState = payload.state || {};
    return {
        ok: true,
        payload: {
            state: savedState,
            formValues: payload.formValues || {}
        }
    };
}

async function loadConfigFile(file, handle) {
    const text = await file.text();
    let parsed = null;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        alert('This file is not valid JSON.');
        return;
    }

    const normalized = normalizeConfigPayload(parsed);
    if (!normalized.ok) {
        alert(normalized.error);
        return;
    }

    if (!confirm('Loading this configuration will replace your current settings. Continue?')) {
        return;
    }

    applyConfigSnapshot(normalized.payload);
    configFileHandle = handle || null;
    alert('Configuration loaded.');
}

function handleConfigImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    loadConfigFile(file, null);
    event.target.value = '';
}

function applyConfigSnapshot(payload) {
    loadPreset('blank');

    const savedState = payload.state || {};
    const savedMode = savedState.mode || 'single';
    const savedAccount = savedState.accountType || 'auto';
    let normalizedAccount = savedAccount;
    if (savedMode === 'restricted' && savedAccount !== 'group' && savedAccount !== 'global') {
        normalizedAccount = 'group';
    }
    if (savedMode !== 'restricted' && (savedAccount === 'group' || savedAccount === 'global')) {
        normalizedAccount = 'auto';
    }
    setMode(savedMode);
    setAccountType(normalizedAccount);

    state.allowedApps = Array.isArray(savedState.allowedApps) ? savedState.allowedApps : [];
    state.startPins = Array.isArray(savedState.startPins) ? savedState.startPins : [];
    state.taskbarPins = Array.isArray(savedState.taskbarPins) ? savedState.taskbarPins : [];
    const autoLaunch = Number.isInteger(savedState.autoLaunchApp) ? savedState.autoLaunchApp : null;

    Object.entries(payload.formValues || {}).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (!el || el.type === 'file') return;
        if (el.type === 'checkbox' || el.type === 'radio') {
            el.checked = !!value;
            return;
        }
        el.value = value;
    });

    renderAppList();
    renderPinList();
    renderTaskbarPinList();
    updatePinTargetPresets();
    updateAutoLaunchSelector();
    if (autoLaunch !== null) {
        dom.get('autoLaunchApp').value = String(autoLaunch);
    }
    updateAutoLaunchSelection();
    updateTabVisibility();
    updateAppTypeUI();
    updateEdgeSourceUI();
    updateEdgeTileSourceUI();
    updateMultiEdgeSourceUI();
    updateTaskbarPinTypeUI();
    updateEditTaskbarPinTypeUI();
    updatePinEdgeArgsModeUI();
    updateEditPinEdgeArgsModeUI();
    updateTaskbarPinEdgeArgsModeUI();
    updateEditTaskbarEdgeArgsModeUI();
    updateEdgeArgsVisibility('pin', 'pinTarget', 'pinEdgeArgsGroup');
    updateEdgeArgsVisibility('editPin', 'editPinTarget', 'editPinEdgeArgsGroup');
    updateEdgeArgsVisibility('taskbarPin', 'taskbarPinTarget', 'taskbarPinEdgeArgsGroup');
    updateEdgeArgsVisibility('editTaskbar', 'editTaskbarPinTarget', 'editTaskbarEdgeArgsGroup');
    updateBreakoutUI();
    updatePreview();
}


function generateReadme() {
    const configName = dom.get('configName').value.trim();
    const profileId = dom.get('profileId').value || '(not set)';
    const now = new Date().toLocaleString();
    const edgeWarningPins = getEdgeShortcutWarningPins();

    let readme = `# Kiosk Configuration Summary\n\n`;
    if (configName) {
        readme += `**Configuration:** ${configName}\n\n`;
    }
    readme += `Generated: ${now}\n\n`;

    // Kiosk Mode
    readme += `## Kiosk Mode\n\n`;
    readme += `**Type:** ${state.mode === 'single' ? 'Single-App' : 'Multi-App'}\n\n`;

    // Account
    readme += `## Account\n\n`;
    if (state.accountType === 'auto') {
        const displayName = dom.get('displayName').value || 'Kiosk User';
        readme += `**Type:** Auto Logon (Managed)\n`;
        readme += `**Display Name:** ${displayName}\n\n`;
    } else {
        const accountName = dom.get('accountName').value || '(not set)';
        readme += `**Type:** Existing Account\n`;
        readme += `**Account:** ${accountName}\n\n`;
    }

    if (state.mode === 'single') {
        // Single-App details
        readme += `## Application\n\n`;
        const appType = dom.get('appType').value;

        if (appType === 'edge') {
            const sourceType = dom.get('edgeSourceType').value;
            const url = sourceType === 'url'
                ? dom.get('edgeUrl').value
                : dom.get('edgeFilePath').value;
            const kioskType = dom.get('edgeKioskType').value;

            readme += `**App:** Microsoft Edge (Kiosk Mode)\n`;
            readme += `**URL:** ${url || '(not set)'}\n`;
            readme += `**Kiosk Type:** ${kioskType === 'fullscreen' ? 'Fullscreen (Digital Signage)' : 'Public Browsing'}\n`;
            readme += `**InPrivate Mode:** Always enabled (automatic in kiosk mode)\n\n`;
        } else if (appType === 'uwp') {
            const aumid = dom.get('uwpAumid').value;
            readme += `**App:** UWP/Store App\n`;
            readme += `**AUMID:** ${aumid || '(not set)'}\n\n`;
        } else {
            const path = dom.get('win32Path').value;
            const args = dom.get('win32Args').value;
            readme += `**App:** Win32 Desktop App\n`;
            readme += `**Path:** ${path || '(not set)'}\n`;
            if (args) readme += `**Arguments:** ${args}\n`;
            readme += `\n`;
        }

        // Breakout sequence
        const breakoutEnabled = dom.get('enableBreakout').checked;
        if (breakoutEnabled) {
            const breakoutPreview = dom.get('breakoutPreview').textContent;
            readme += `## Breakout Sequence\n\n`;
            readme += `**Enabled:** Yes\n`;
            readme += `**Key Combination:** ${breakoutPreview}\n\n`;
        }
    } else {
        // Multi-App details
        readme += `## Whitelisted Applications\n\n`;
        if (state.allowedApps.length === 0) {
            readme += `(No applications added)\n\n`;
        } else {
            state.allowedApps.forEach((app, i) => {
                const isAutoLaunch = state.autoLaunchApp === i;
                readme += `${i + 1}. ${app.value}${isAutoLaunch ? ' **(Auto-Launch)**' : ''}\n`;
            });
            readme += `\n`;
        }

        // Auto-launch Edge config
        if (state.autoLaunchApp !== null) {
            const autoApp = state.allowedApps[state.autoLaunchApp];
            if (autoApp && autoApp.value.toLowerCase().includes('msedge')) {
                readme += `## Edge Auto-Launch Settings\n\n`;
                const sourceType = dom.get('multiEdgeSourceType').value;
                const url = sourceType === 'url'
                    ? dom.get('multiEdgeUrl').value
                    : dom.get('multiEdgeFilePath').value;
                const kioskType = dom.get('multiEdgeKioskType').value;

                readme += `**URL:** ${url || '(not set)'}\n`;
                readme += `**Kiosk Type:** ${kioskType === 'fullscreen' ? 'Fullscreen' : 'Public Browsing'}\n`;
                readme += `**InPrivate Mode:** Always enabled (automatic in kiosk mode)\n\n`;
            }
        }

        // Start menu pins
        readme += `## Start Menu Pins\n\n`;
        if (state.startPins.length === 0) {
            readme += `(No pins configured)\n\n`;
        } else {
            state.startPins.forEach((pin, i) => {
                readme += `${i + 1}. **${pin.name || '(unnamed)'}**\n`;
                readme += `   - Target: ${pin.target || '(not set)'}\n`;
                if (pin.args) readme += `   - Arguments: ${pin.args}\n`;
                if (pin.systemShortcut) readme += `   - Uses system shortcut\n`;
            });
            readme += `\n`;
        }

        // System restrictions
        readme += `## System Restrictions\n\n`;
        const showTaskbar = dom.get('showTaskbar').checked;
        const fileExplorer = dom.get('fileExplorerAccess').value;

        readme += `**Taskbar:** ${showTaskbar ? 'Visible' : 'Hidden'}\n`;
        readme += `**File Explorer Access:** `;
        switch (fileExplorer) {
            case 'none': readme += `Disabled\n`; break;
            case 'downloads': readme += `Downloads folder only\n`; break;
            case 'removable': readme += `Removable drives only\n`; break;
            case 'downloads-removable': readme += `Downloads + Removable drives\n`; break;
            case 'all': readme += `No restriction\n`; break;
            default: readme += `${fileExplorer}\n`;
        }
        readme += `\n`;
    }

    if (edgeWarningPins.length > 0) {
        readme += `## Warnings\n\n`;
        readme += `Some Edge-backed shortcuts may not display custom name/icon in Assigned Access. ` +
            `Assigned Access renders these pins using the Edge app identity, ignoring .lnk metadata.\n\n`;
        readme += `Affected pins:\n`;
        edgeWarningPins.forEach(name => {
            readme += `- ${name}\n`;
        });
        readme += `\n`;
    }

    // Profile ID
    readme += `## Profile\n\n`;
    readme += `**Profile GUID:** ${profileId}\n\n`;

    // Deployment note
    readme += `---\n\n`;
    readme += `## Deployment\n\n`;
    readme += `Run the PowerShell script as SYSTEM:\n`;
    readme += `\`\`\`\npsexec.exe -i -s powershell.exe -ExecutionPolicy Bypass -File "AssignedAccess-<Config>.ps1"\n\`\`\`\n\n`;
    readme += `A reboot is required after applying the configuration.\n`;

    return readme;
}

/* ============================================================================
   Import XML
   ============================================================================ */
function importXml() {
    dom.get('importInput').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            parseAndLoadXml(e.target.result);
            alert('XML imported successfully!');
        } catch (err) {
            alert('Failed to parse XML: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function parseAndLoadXml(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const root = doc.documentElement;
    if (!root || root.localName !== 'AssignedAccessConfiguration') {
        throw new Error('Only AssignedAccess configuration XML files are supported.');
    }

    // Profile ID
    const profile = doc.querySelector('Profile');
    if (profile) {
        dom.get('profileId').value = profile.getAttribute('Id') || '';
    }

    // Check for KioskModeApp (single-app) or AllAppsList (multi-app)
    const kioskModeApp = doc.querySelector('KioskModeApp');
    const allAppsList = doc.querySelector('AllAppsList');

    if (kioskModeApp && !allAppsList) {
        // Single-app mode
        setMode('single');

        const aumid = kioskModeApp.getAttribute('AppUserModelId');
        const classicArgs = kioskModeApp.getAttributeNS('http://schemas.microsoft.com/AssignedAccess/2021/config', 'ClassicAppArguments') ||
                           kioskModeApp.getAttribute('v4:ClassicAppArguments');

        if (aumid === 'MSEdge' || (aumid && aumid.includes('Edge'))) {
            dom.get('appType').value = 'edge';
            updateAppTypeUI();

            if (classicArgs) {
                // Parse Edge arguments
                const urlMatch = classicArgs.match(/--kiosk\s+(\S+)/);
                if (urlMatch) {
                    const extractedUrl = urlMatch[1];
                    // Check if it's a file:// URL
                    if (extractedUrl.toLowerCase().startsWith('file:///')) {
                        dom.get('edgeSourceType').value = 'file';
                        // Decode the file path and remove file:/// prefix
                        let filePath = extractedUrl.substring(8); // Remove 'file:///'
                        filePath = decodeURIComponent(filePath);
                        dom.get('edgeFilePath').value = filePath;
                        dom.get('edgeUrl').value = '';
                    } else {
                        dom.get('edgeSourceType').value = 'url';
                        dom.get('edgeUrl').value = extractedUrl;
                        dom.get('edgeFilePath').value = '';
                    }
                    updateEdgeSourceUI();
                }

                dom.get('edgeKioskType').value =
                    classicArgs.includes('public-browsing') ? 'public-browsing' : 'fullscreen';
                // InPrivate is always enabled in kiosk mode, no need to import this setting
            }
        } else if (aumid) {
            dom.get('appType').value = 'uwp';
            updateAppTypeUI();
            dom.get('uwpAumid').value = aumid;
        } else {
            // Win32 app - check for ClassicAppPath
            const classicAppPath = kioskModeApp.getAttributeNS('http://schemas.microsoft.com/AssignedAccess/2021/config', 'ClassicAppPath') ||
                                  kioskModeApp.getAttribute('v4:ClassicAppPath');
            if (classicAppPath) {
                dom.get('appType').value = 'win32';
                updateAppTypeUI();
                dom.get('win32Path').value = classicAppPath;
                dom.get('win32Args').value = classicArgs || '';
            }
        }

        // Import BreakoutSequence if present (handle namespace prefix)
        const breakoutSequence = doc.querySelector('BreakoutSequence, [*|BreakoutSequence]') ||
                                Array.from(doc.querySelectorAll('*')).find(el => el.localName === 'BreakoutSequence');
        const breakoutKey = breakoutSequence ? breakoutSequence.getAttribute('Key') : null;
        if (breakoutKey) {
            dom.get('enableBreakout').checked = true;
            updateBreakoutUI();

            // Parse the key combination (e.g., "Ctrl+Alt+K")
            const parts = breakoutKey.split('+');
            const finalKey = parts[parts.length - 1].toUpperCase();

            dom.get('breakoutCtrl').checked = breakoutKey.toLowerCase().includes('ctrl');
            dom.get('breakoutAlt').checked = breakoutKey.toLowerCase().includes('alt');
            dom.get('breakoutShift').checked = breakoutKey.toLowerCase().includes('shift');

            // Set the final key if it's a valid option
            const finalKeySelect = dom.get('breakoutFinalKey');
            for (let option of finalKeySelect.options) {
                if (option.value === finalKey) {
                    finalKeySelect.value = finalKey;
                    break;
                }
            }
            updateBreakoutPreview();
        } else {
            dom.get('enableBreakout').checked = false;
            updateBreakoutUI();
        }
    } else if (allAppsList) {
        // Multi-app mode
        setMode('multi');

        state.allowedApps = [];
        state.autoLaunchApp = null;
        const apps = allAppsList.querySelectorAll('App');
        let appIndex = 0;
        apps.forEach(app => {
            const aumid = app.getAttribute('AppUserModelId');
            const path = app.getAttribute('DesktopAppPath');
            if (aumid) {
                state.allowedApps.push({ type: 'aumid', value: aumid });
            } else if (path) {
                state.allowedApps.push({ type: 'path', value: path });
            }

            // Check for AutoLaunch attribute (rs5 namespace)
            const autoLaunch = app.getAttributeNS('http://schemas.microsoft.com/AssignedAccess/201901/config', 'AutoLaunch') ||
                              app.getAttribute('rs5:AutoLaunch');
            if (autoLaunch === 'true') {
                state.autoLaunchApp = appIndex;

                // Parse AutoLaunchArguments
                const autoLaunchArgs = app.getAttributeNS('http://schemas.microsoft.com/AssignedAccess/201901/config', 'AutoLaunchArguments') ||
                                      app.getAttribute('rs5:AutoLaunchArguments');
                if (autoLaunchArgs) {
                    const currentAppPath = path || aumid;
                    const isEdge = isEdgeApp(currentAppPath);

                    if (isEdge) {
                        // Parse Edge arguments
                        const urlMatch = autoLaunchArgs.match(/--kiosk\s+(\S+)/);
                        if (urlMatch) {
                            const extractedUrl = urlMatch[1];
                            if (extractedUrl.toLowerCase().startsWith('file:///')) {
                                dom.get('multiEdgeSourceType').value = 'file';
                                let filePath = extractedUrl.substring(8);
                                filePath = decodeURIComponent(filePath);
                                dom.get('multiEdgeFilePath').value = filePath;
                                dom.get('multiEdgeUrl').value = '';
                            } else {
                                dom.get('multiEdgeSourceType').value = 'url';
                                dom.get('multiEdgeUrl').value = extractedUrl;
                                dom.get('multiEdgeFilePath').value = '';
                            }
                            updateMultiEdgeSourceUI();
                        }

                        dom.get('multiEdgeKioskType').value =
                            autoLaunchArgs.includes('public-browsing') ? 'public-browsing' : 'fullscreen';
                        // InPrivate is always enabled in kiosk mode, no need to import this setting
                    } else if (path) {
                        // Non-Edge Win32 app - populate win32 args field
                        dom.get('win32AutoLaunchArgs').value = autoLaunchArgs;
                    }
                }
            }
            appIndex++;
        });
        renderAppList();
        updateAutoLaunchSelector();
        // Restore auto-launch selection after selector is populated
        if (state.autoLaunchApp !== null) {
            dom.get('autoLaunchApp').value = state.autoLaunchApp;
            updateMultiAppEdgeUI();
        }

        // Start Pins (handle namespace prefix v5:StartPins)
        // Note: Imported shortcuts will only have names extracted from paths
        // User will need to verify/update target paths if importing older configs
        state.startPins = [];
        const startPins = doc.querySelector('StartPins') ||
                         Array.from(doc.querySelectorAll('*')).find(el => el.localName === 'StartPins');
        if (startPins) {
            try {
                const pinsJson = JSON.parse(startPins.textContent);
                if (pinsJson.pinnedList) {
                    pinsJson.pinnedList.forEach(pin => {
                        if (pin.desktopAppLink) {
                            // Try to extract name from path (e.g., %ALLUSERSPROFILE%\Microsoft\Windows\Start Menu\Programs\Name.lnk)
                            const path = pin.desktopAppLink;
                            let name = path;

                            // Extract filename without extension
                            const match = path.match(/([^\\\/]+)\.lnk$/i);
                            if (match) {
                                name = match[1];
                            }

                            // Create a basic shortcut object - user may need to update target
                            state.startPins.push({
                                name: name,
                                target: '', // Unknown from XML, user needs to set if no .lnk is available
                                systemShortcut: path,
                                args: '',
                                workingDir: '',
                                iconPath: ''
                            });
                        }
                    });
                }
                if (state.startPins.length > 0 && state.startPins.some(p => !p.target)) {
                    console.warn('Imported shortcuts need target paths configured');
                }
            } catch (e) {
                console.warn('Failed to parse StartPins JSON:', e.message);
            }
        }
        renderPinList();

        // Taskbar (handle namespace prefix v4:Taskbar)
        const taskbar = doc.querySelector('Taskbar') ||
                       Array.from(doc.querySelectorAll('*')).find(el => el.localName === 'Taskbar');
        if (taskbar) {
            dom.get('showTaskbar').checked =
                taskbar.getAttribute('ShowTaskbar') === 'true';
        }

        // File Explorer restrictions (handle namespace prefix rs5:FileExplorerNamespaceRestrictions)
        const fileExplorerRestrictions = doc.querySelector('FileExplorerNamespaceRestrictions') ||
                                        Array.from(doc.querySelectorAll('*')).find(el => el.localName === 'FileExplorerNamespaceRestrictions');
        if (fileExplorerRestrictions) {
            const downloads = fileExplorerRestrictions.querySelector('AllowedNamespace[Name="Downloads"]') ||
                             Array.from(fileExplorerRestrictions.querySelectorAll('*')).find(el => el.localName === 'AllowedNamespace' && el.getAttribute('Name') === 'Downloads');
            const removable = fileExplorerRestrictions.querySelector('AllowRemovableDrives') ||
                             Array.from(fileExplorerRestrictions.querySelectorAll('*')).find(el => el.localName === 'AllowRemovableDrives');
            const noRestriction = fileExplorerRestrictions.querySelector('NoRestriction') ||
                                 Array.from(fileExplorerRestrictions.querySelectorAll('*')).find(el => el.localName === 'NoRestriction');

            if (noRestriction) {
                dom.get('fileExplorerAccess').value = 'all';
            } else if (downloads && removable) {
                dom.get('fileExplorerAccess').value = 'downloads-removable';
            } else if (downloads) {
                dom.get('fileExplorerAccess').value = 'downloads';
            } else if (removable) {
                dom.get('fileExplorerAccess').value = 'removable';
            } else {
                dom.get('fileExplorerAccess').value = 'none';
            }
        } else {
            dom.get('fileExplorerAccess').value = 'none';
        }
    }

    // Account
    const autoLogon = doc.querySelector('AutoLogonAccount');
    const account = doc.querySelector('Config Account');

    if (autoLogon) {
        setAccountType('auto');
        const displayName = autoLogon.getAttributeNS('http://schemas.microsoft.com/AssignedAccess/201901/config', 'DisplayName') ||
                           autoLogon.getAttribute('rs5:DisplayName') ||
                           autoLogon.getAttribute('DisplayName');
        dom.get('displayName').value = displayName || '';
    } else if (account) {
        setAccountType('existing');
        dom.get('accountName').value = account.textContent || '';
    }

    updatePreview();
}

/* ============================================================================
   Presets
   ============================================================================ */
function loadPreset(preset) {
    // Reset state
    state.allowedApps = [];
    state.startPins = [];
    state.autoLaunchApp = null;
    configFileHandle = null;

    // Reset config name
    dom.get('configName').value = '';

    // Reset multi-app Edge config
    dom.get('multiEdgeSourceType').value = 'url';
    dom.get('multiEdgeUrl').value = '';
    dom.get('multiEdgeFilePath').value = '';
    dom.get('multiEdgeKioskType').value = 'fullscreen';
    dom.get('win32AutoLaunchArgs').value = '';
    updateMultiEdgeSourceUI();

    switch (preset) {
        case 'blank':
            setMode('single');
            setAccountType('auto');
            generateGuid();
            dom.get('displayName').value = '';
            dom.get('appType').value = 'edge';
            dom.get('edgeSourceType').value = 'url';
            dom.get('edgeUrl').value = '';
            dom.get('edgeFilePath').value = '';
            dom.get('edgeKioskType').value = 'fullscreen';
            updateAppTypeUI();
            updateEdgeSourceUI();
            break;

        case 'edgeFullscreen':
            setMode('single');
            setAccountType('auto');
            generateGuid();
            dom.get('displayName').value = 'Kiosk';
            dom.get('appType').value = 'edge';
            dom.get('edgeSourceType').value = 'url';
            dom.get('edgeUrl').value = 'https://www.microsoft.com';
            dom.get('edgeFilePath').value = '';
            dom.get('edgeKioskType').value = 'fullscreen';
            updateAppTypeUI();
            updateEdgeSourceUI();
            break;

        case 'edgePublic':
            setMode('single');
            setAccountType('auto');
            generateGuid();
            dom.get('displayName').value = 'Public Browsing';
            dom.get('appType').value = 'edge';
            dom.get('edgeSourceType').value = 'url';
            dom.get('edgeUrl').value = 'https://www.bing.com';
            dom.get('edgeFilePath').value = '';
            dom.get('edgeKioskType').value = 'public-browsing';
            updateAppTypeUI();
            updateEdgeSourceUI();
            break;

        case 'multiApp':
            setMode('multi');
            setAccountType('auto');
            generateGuid();
            dom.get('displayName').value = 'Multi-App Kiosk';
            addCommonApp('edge');
            addCommonApp('osk');
            addCommonApp('calculator');
            dom.get('showTaskbar').checked = true;
            dom.get('fileExplorerAccess').value = 'downloads';
            break;

    }

    updateAppTypeUI();
    renderAppList();
    updateAutoLaunchSelector();
    updatePreview();
}

/* ============================================================================
   Tooltip Positioning
   ============================================================================ */
function positionTooltip(tooltipIcon) {
    const tooltip = tooltipIcon.nextElementSibling;
    if (!tooltip || !tooltip.classList.contains('tooltip-content')) return;

    const iconRect = tooltipIcon.getBoundingClientRect();
    const tooltipWidth = 320; // matches CSS width
    const padding = 10;

    // Position below the icon
    let top = iconRect.bottom + 8;
    let left = iconRect.left + (iconRect.width / 2) - (tooltipWidth / 2);

    // Keep within viewport bounds
    if (left < padding) {
        left = padding;
    } else if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
    }

    // If tooltip would go below viewport, position above instead
    const tooltipHeight = tooltip.offsetHeight || 150;
    if (top + tooltipHeight > window.innerHeight - padding) {
        top = iconRect.top - tooltipHeight - 8;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}

/* ============================================================================
   Initialize
   ============================================================================ */
document.addEventListener('DOMContentLoaded', async () => {
    // Load presets first
    await loadPresets();

    generateGuid();
    initCallouts();
    updateTabVisibility();
    updatePreview();
    updateEdgeTileSourceUI();
    updatePinTargetPresets();
    updateTaskbarPinTypeUI();
    updateEditTaskbarPinTypeUI();
    updatePinEdgeArgsModeUI();
    updateEditPinEdgeArgsModeUI();
    updateTaskbarPinEdgeArgsModeUI();
    updateEditTaskbarEdgeArgsModeUI();
    updateEdgeArgsVisibility('pin', 'pinTarget', 'pinEdgeArgsGroup');
    updateEdgeArgsVisibility('editPin', 'editPinTarget', 'editPinEdgeArgsGroup');
    updateEdgeArgsVisibility('taskbarPin', 'taskbarPinTarget', 'taskbarPinEdgeArgsGroup');
    updateEdgeArgsVisibility('editTaskbar', 'editTaskbarPinTarget', 'editTaskbarEdgeArgsGroup');
    updateExportAvailability();

    const konamiSequence = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'
    ];
    let konamiIndex = 0;
    document.addEventListener('keydown', (event) => {
        const expectedKey = konamiSequence[konamiIndex];
        if (event.code === expectedKey) {
            konamiIndex++;
            if (konamiIndex === konamiSequence.length) {
                window.location.href = 'https://hirejoshua.com';
                konamiIndex = 0;
            }
            return;
        }
        konamiIndex = event.code === konamiSequence[0] ? 1 : 0;
    });

    document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        runAction(target.dataset.action, target, event);
    });

    document.addEventListener('change', (event) => {
        const target = event.target.closest('[data-change]');
        if (!target) return;
        runActions(target.dataset.change, target, event);
    });

    document.addEventListener('input', (event) => {
        const prefix = getEdgeArgsPrefixFromId(event.target?.id);
        if (!prefix) return;
        syncEdgeArgsField(prefix);
        const targetConfig = getEdgeArgsTargetConfigFromId(event.target?.id);
        if (targetConfig) {
            updateEdgeArgsVisibility(targetConfig.prefix, targetConfig.targetId, targetConfig.groupId);
        }
    });

    document.addEventListener('dragstart', handlePinDragStart);
    document.addEventListener('dragover', handlePinDragOver);
    document.addEventListener('dragleave', handlePinDragLeave);
    document.addEventListener('drop', handlePinDrop);
    document.addEventListener('dragend', handlePinDragEnd);

    // Add tooltip positioning on hover/focus
    document.querySelectorAll('.tooltip-icon').forEach(icon => {
        icon.addEventListener('mouseenter', () => positionTooltip(icon));
        icon.addEventListener('focus', () => positionTooltip(icon));
    });
});

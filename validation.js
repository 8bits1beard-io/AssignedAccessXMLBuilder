/* ============================================================================
   Validation
   ============================================================================ */
function validate() {
    function isStartMenuShortcutPath(path) {
        if (!path) return false;
        const normalized = path.replace(/\//g, '\\').toLowerCase();
        const startMenuFragment = '\\microsoft\\windows\\start menu\\programs\\';
        const hasFragment = normalized.includes(startMenuFragment);
        const allowedRoots = [
            '%appdata%',
            '%allusersprofile%',
            '%programdata%',
            'c:\\users\\',
            'c:\\programdata\\'
        ];
        return hasFragment && allowedRoots.some(root => normalized.startsWith(root));
    }

    const rules = [
        () => {
            const errs = [];
            const configName = dom.get('configName').value.trim();
            if (!configName) {
                errs.push({ message: 'Configuration Name is required', field: 'configName', tab: 'setup' });
            }
            const profileId = dom.get('profileId').value;
            if (!profileId) {
                errs.push({ message: 'Profile GUID is required', field: 'profileId', tab: 'setup' });
            } else if (!/^\{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}$/i.test(profileId)) {
                errs.push({ message: 'Profile GUID format is invalid', field: 'profileId', tab: 'setup' });
            }
            return errs;
        },
        () => {
            const errs = [];
            if (state.accountType === 'auto') {
                const displayName = dom.get('displayName').value;
                if (!displayName) errs.push({ message: 'Display Name is required for auto-logon account', field: 'displayName', tab: 'setup' });
            } else if (state.accountType === 'existing') {
                const accountName = dom.get('accountName').value;
                if (!accountName) errs.push({ message: 'Account Name is required', field: 'accountName', tab: 'setup' });
            } else if (state.accountType === 'group') {
                const groupName = dom.get('groupName').value;
                if (!groupName) errs.push({ message: 'Group Name is required', field: 'groupName', tab: 'setup' });
            }
            return errs;
        },
        () => {
            const errs = [];
            if (state.mode !== 'single') return errs;

            const appType = dom.get('appType').value;
            if (appType === 'edge') {
                const sourceType = dom.get('edgeSourceType').value;
                if (sourceType === 'url') {
                    const url = dom.get('edgeUrl').value;
                    if (!url) errs.push({ message: 'Edge URL is required', field: 'edgeUrl', tab: 'setup' });
                } else {
                    const filePath = dom.get('edgeFilePath').value;
                    if (!filePath) errs.push({ message: 'Edge file path is required', field: 'edgeFilePath', tab: 'setup' });
                }
            } else if (appType === 'uwp') {
                const aumid = dom.get('uwpAumid').value;
                if (!aumid) errs.push({ message: 'UWP App AUMID is required', field: 'uwpAumid', tab: 'setup' });
            } else if (appType === 'win32') {
                const path = dom.get('win32Path').value;
                if (!path) errs.push({ message: 'Win32 Application Path is required', field: 'win32Path', tab: 'setup' });
            }

            return errs;
        },
        () => {
            const errs = [];
            if (state.mode !== 'multi' && state.mode !== 'restricted') return errs;

            if (state.allowedApps.length === 0) {
                errs.push({ message: 'At least one allowed app is required', field: null, tab: 'application' });
            }

            const missingTargets = state.startPins.filter(p => p.pinType === 'desktopAppLink' && !p.target && !p.systemShortcut);
            if (missingTargets.length > 0) {
                errs.push({ message: `${missingTargets.length} shortcut(s) missing target path: ${missingTargets.map(p => p.name).join(', ')}`, field: null, tab: 'startmenu' });
            }

            const invalidShortcutPaths = state.startPins.filter(p => p.systemShortcut && !isStartMenuShortcutPath(p.systemShortcut));
            if (invalidShortcutPaths.length > 0) {
                errs.push({ message: `Start menu pin shortcuts must live under the Start Menu Programs folder (%APPDATA% or %ALLUSERSPROFILE%): ${invalidShortcutPaths.map(p => p.name).join(', ')}`, field: null, tab: 'startmenu' });
            }

            return errs;
        }
    ];

    return rules.flatMap(rule => rule());
}

function validateField(fieldId) {
    const errors = validate();
    const fieldError = errors.find(e => e.field === fieldId);
    return fieldError ? fieldError.message : null;
}

function showValidation() {
    const errors = validate();
    const statusDiv = dom.get('validationStatus');

    if (errors.length === 0) {
        statusDiv.innerHTML = '';
    } else {
        statusDiv.innerHTML = `<div class="status error">
            <strong>Validation Errors:</strong>
            <ul style="margin: 5px 0 0 20px;">${errors.map(e => `<li>${e.message}</li>`).join('')}</ul>
        </div>`;
    }

    return errors.length === 0;
}

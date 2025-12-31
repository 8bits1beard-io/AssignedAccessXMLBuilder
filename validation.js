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
            const profileId = dom.get('profileId').value;
            if (!profileId) {
                errs.push('Profile GUID is required');
            } else if (!/^\{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}$/i.test(profileId)) {
                errs.push('Profile GUID format is invalid');
            }
            return errs;
        },
        () => {
            const errs = [];
            if (state.accountType === 'auto') {
                const displayName = dom.get('displayName').value;
                if (!displayName) errs.push('Display Name is required for auto-logon account');
            } else if (state.accountType === 'existing') {
                const accountName = dom.get('accountName').value;
                if (!accountName) errs.push('Account Name is required');
            } else if (state.accountType === 'group') {
                const groupName = dom.get('groupName').value;
                if (!groupName) errs.push('Group Name is required');
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
                    if (!url) errs.push('Edge URL is required');
                } else {
                    const filePath = dom.get('edgeFilePath').value;
                    if (!filePath) errs.push('Edge file path is required');
                }
            } else if (appType === 'uwp') {
                const aumid = dom.get('uwpAumid').value;
                if (!aumid) errs.push('UWP App AUMID is required');
            } else if (appType === 'win32') {
                const path = dom.get('win32Path').value;
                if (!path) errs.push('Win32 Application Path is required');
            }

            return errs;
        },
        () => {
            const errs = [];
            if (state.mode !== 'multi' && state.mode !== 'restricted') return errs;

            if (state.allowedApps.length === 0) {
                errs.push('At least one allowed app is required');
            }

            const missingTargets = state.startPins.filter(p => p.pinType === 'desktopAppLink' && !p.target && !p.systemShortcut);
            if (missingTargets.length > 0) {
                errs.push(`${missingTargets.length} shortcut(s) missing target path: ${missingTargets.map(p => p.name).join(', ')}`);
            }

            const invalidShortcutPaths = state.startPins.filter(p => p.systemShortcut && !isStartMenuShortcutPath(p.systemShortcut));
            if (invalidShortcutPaths.length > 0) {
                errs.push(`Start menu pin shortcuts must live under the Start Menu Programs folder (%APPDATA% or %ALLUSERSPROFILE%): ${invalidShortcutPaths.map(p => p.name).join(', ')}`);
            }

            return errs;
        }
    ];

    return rules.flatMap(rule => rule());
}

function showValidation() {
    const errors = validate();
    const statusDiv = dom.get('validationStatus');

    if (errors.length === 0) {
        statusDiv.innerHTML = '<div class="status success">✓ Configuration is valid</div>';
    } else {
        statusDiv.innerHTML = `<div class="status error">
            <strong>Validation Errors:</strong>
            <ul style="margin: 5px 0 0 20px;">${errors.map(e => `<li>${e}</li>`).join('')}</ul>
        </div>`;
    }

    return errors.length === 0;
}

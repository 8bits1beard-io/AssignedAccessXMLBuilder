/* ============================================================================
   Summary
   ============================================================================ */
function formatKioskModeSummary() {
    if (state.mode === 'single') {
        const appType = dom.get('appType').value;
        if (appType === 'edge') {
            const kioskType = dom.get('edgeKioskType').value;
            const kioskLabel = kioskType === 'public-browsing' ? 'Public Browsing' : 'Fullscreen';
            return `Single-App (Edge - ${kioskLabel})`;
        }
        if (appType === 'uwp') return 'Single-App (UWP)';
        return 'Single-App (Win32)';
    }
    return state.mode === 'restricted' ? 'Restricted User' : 'Multi-App';
}

function formatAllowedAppsSummary() {
    if (state.mode === 'single') {
        return 'N/A (single-app mode)';
    }
    if (state.allowedApps.length === 0) {
        return 'None';
    }
    const items = state.allowedApps.map((app, index) => {
        const label = isEdgeApp(app.value) ? 'Microsoft Edge' : app.value;
        const autoTag = state.autoLaunchApp === index ? ' (auto-launch)' : '';
        return `<li>${escapeXml(label)}${autoTag}</li>`;
    }).join('');
    return `<ul>${items}</ul>`;
}

function formatStartPinsSummary() {
    if (state.mode === 'single') {
        return 'N/A (single-app mode)';
    }
    if (state.startPins.length === 0) {
        return 'None';
    }
    const items = state.startPins.map(pin => {
        const name = pin.name || 'Unnamed pin';
        const args = pin.args ? ` (args: ${pin.args})` : '';
        return `<li>${escapeXml(name)}${escapeXml(args)}</li>`;
    }).join('');
    return `<ul>${items}</ul>`;
}

function formatAutoLaunchSummary() {
    if (state.mode === 'single') {
        const appType = dom.get('appType').value;
        if (appType === 'edge') {
            const url = getEdgeUrl();
            const kioskType = dom.get('edgeKioskType').value;
            const idleTimeout = parseInt(dom.get('edgeIdleTimeout').value) || 0;
            const args = buildEdgeKioskArgs(url, kioskType, idleTimeout);
            return `Microsoft Edge (args: ${args})`;
        }
        if (appType === 'uwp') {
            const aumid = dom.get('uwpAumid').value.trim();
            return aumid ? `UWP App (${aumid})` : 'UWP App';
        }
        const path = dom.get('win32Path').value.trim();
        const args = dom.get('win32Args').value.trim();
        return path ? `${path}${args ? ` (args: ${args})` : ''}` : 'Win32 App';
    }

    if (state.autoLaunchApp === null || !state.allowedApps[state.autoLaunchApp]) {
        return 'None';
    }

    const app = state.allowedApps[state.autoLaunchApp];
    const label = isEdgeApp(app.value) ? 'Microsoft Edge' : app.value;
    let args = '';

    if (isEdgeApp(app.value)) {
        const url = getMultiAppEdgeUrl();
        const kioskType = dom.get('multiEdgeKioskType').value;
        args = buildEdgeKioskArgs(url, kioskType, 0);
    } else if (app.type === 'path') {
        args = dom.get('win32AutoLaunchArgs').value.trim();
    }

    return `${label}${args ? ` (args: ${args})` : ''}`;
}

function updateSummary() {
    const summaryOverview = dom.get('summaryOverview');
    const summaryDetails = dom.get('summaryDetails');
    if (!summaryOverview || !summaryDetails) return;

    const configName = dom.get('configName').value.trim() || 'Unnamed';
    const autoLogon = state.accountType === 'auto';
    const displayName = dom.get('displayName').value.trim();
    const accountName = dom.get('accountName')?.value.trim() || '';
    const groupName = dom.get('groupName')?.value.trim() || '';
    const groupType = dom.get('groupType')?.value || '';

    let accountSummary = 'Auto Logon (Managed)';
    if (state.accountType === 'existing') {
        accountSummary = accountName ? `Existing Account (${accountName})` : 'Existing Account';
    } else if (state.accountType === 'group') {
        const typeLabel = groupType ? `, ${groupType}` : '';
        accountSummary = groupName ? `User Group (${groupName}${typeLabel})` : 'User Group';
    } else if (state.accountType === 'global') {
        accountSummary = 'Global Profile (All non-admin users)';
    } else if (state.accountType === 'auto') {
        accountSummary = displayName ? `Auto Logon (${displayName})` : 'Auto Logon (Managed)';
    }

    const exportStatus = getExportStatus() === 'ready' ? 'Ready' : 'Needs Attention';
    const allowedAppsValue = state.mode === 'single' ? 'Single App' : String(state.allowedApps.length);
    const pinsValue = state.mode === 'single'
        ? 'N/A'
        : `Start: ${state.startPins.length} / Taskbar: ${state.taskbarPins.length}`;

    summaryOverview.innerHTML = [
        { label: 'Name', value: escapeXml(configName) },
        { label: 'Kiosk Type', value: escapeXml(formatKioskModeSummary()) },
        { label: 'Account', value: escapeXml(accountSummary) },
        { label: 'Allowed Apps', value: escapeXml(allowedAppsValue) },
        { label: 'Pins', value: escapeXml(pinsValue) },
        { label: 'Export Status', value: escapeXml(exportStatus) }
    ].map(row => `
        <div class="summary-card">
            <div class="summary-card-label">${row.label}</div>
            <div class="summary-card-value">${row.value}</div>
        </div>
    `).join('');

    const showTaskbar = dom.get('showTaskbar')?.checked;
    const fileExplorerLabel = dom.get('fileExplorerAccess')?.selectedOptions?.[0]?.textContent || 'Unknown';

    const allowedAppsDetails = state.mode === 'single'
        ? 'Single-app mode uses the kiosk app selection.'
        : formatAllowedAppsSummary();
    const startPinsDetails = state.mode === 'single'
        ? 'N/A (single-app mode)'
        : formatStartPinsSummary();

    summaryDetails.innerHTML = `
        <details class="summary-panel" open>
            <summary>Allowed Apps</summary>
            <div class="summary-panel-body">${allowedAppsDetails}</div>
        </details>
        <details class="summary-panel">
            <summary>Start Menu Pins</summary>
            <div class="summary-panel-body">${startPinsDetails}</div>
        </details>
        <details class="summary-panel">
            <summary>Auto-Launch App</summary>
            <div class="summary-panel-body">${escapeXml(formatAutoLaunchSummary())}</div>
        </details>
        <details class="summary-panel">
            <summary>Account Details</summary>
            <div class="summary-panel-body">
                <div><strong>Account:</strong> ${escapeXml(accountSummary)}</div>
                <div><strong>Auto Logon:</strong> ${autoLogon ? 'Yes' : 'No'}</div>
                <div><strong>User:</strong> ${autoLogon ? escapeXml(displayName || 'Managed kiosk account') : 'N/A'}</div>
            </div>
        </details>
        <details class="summary-panel">
            <summary>System Access</summary>
            <div class="summary-panel-body">
                <div><strong>Show Taskbar:</strong> ${showTaskbar ? 'Enabled' : 'Hidden'}</div>
                <div><strong>File Explorer:</strong> ${escapeXml(fileExplorerLabel)}</div>
            </div>
        </details>
    `;

    updateNextActionBanner();
}

function updateNextActionBanner() {
    const banner = dom.get('summaryNextAction');
    if (!banner) return;

    let message = '';
    const setupStatus = typeof getSetupStatus === 'function' ? getSetupStatus() : 'pending';
    const appsStatus = typeof getAppsStatus === 'function' ? getAppsStatus() : 'pending';
    const exportStatus = typeof getExportStatus === 'function' ? getExportStatus() : 'pending';

    if (setupStatus !== 'complete') {
        message = 'Next: complete profile and account details in Setup.';
    } else if (appsStatus !== 'complete') {
        message = 'Next: add at least one allowed app.';
    } else if (state.mode !== 'single' && state.startPins.length === 0) {
        message = 'Optional: add Start menu pins for quick access.';
    } else if (exportStatus !== 'ready') {
        message = 'Next: resolve validation errors to enable export.';
    } else {
        message = 'Ready to export. Download the XML or helper scripts.';
    }

    banner.textContent = message;
    banner.classList.add('active');
}

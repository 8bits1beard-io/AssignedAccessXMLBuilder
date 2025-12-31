/* ============================================================================
   Helpers
   ============================================================================ */
function isEdgeApp(value) {
    if (!value) return false;
    const lowerValue = value.toLowerCase();
    return lowerValue.includes('msedge') ||
           lowerValue.includes('microsoftedge') ||
           lowerValue.includes('edge\\application');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    });
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function escapeXml(str) {
    if (str === null || str === undefined) return '';
    return str.replace(/[<>&'"]/g, function(c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len - 3) + '...' : str;
}

function buildFileUrl(filePath) {
    if (!filePath) return '';
    let normalized = filePath.trim();
    if (!normalized) return '';
    if (normalized.toLowerCase().startsWith('file:///')) {
        return normalized;
    }
    normalized = normalized.replace(/\\/g, '/');
    normalized = normalized.split('/').map((segment, index) => {
        if (index === 0 && /^[A-Za-z]:$/.test(segment)) {
            return segment;
        }
        return encodeURIComponent(segment);
    }).join('/');
    if (!normalized.toLowerCase().startsWith('file:///')) {
        normalized = 'file:///' + normalized;
    }
    return normalized;
}

function buildLaunchUrl(sourceType, urlValue, filePathValue, fallbackUrl) {
    if (sourceType === 'file') {
        return buildFileUrl(filePathValue) || buildFileUrl('C:/Kiosk/index.html');
    }
    return urlValue || fallbackUrl || '';
}

function buildEdgeKioskArgs(url, kioskType, idleTimeout) {
    let args = `--kiosk ${url} --edge-kiosk-type=${kioskType} --no-first-run`;
    if (idleTimeout && idleTimeout > 0) {
        args += ` --kiosk-idle-timeout-minutes=${idleTimeout}`;
    }
    return args;
}

function buildBrowserKioskArgs(browser, url, kioskType) {
    if (!url) return '';
    if (browser === 'edge') {
        const mode = kioskType || 'fullscreen';
        return buildEdgeKioskArgs(url, mode, 0);
    }
    if (browser === 'chrome') {
        return `--kiosk ${url} --no-first-run`;
    }
    if (browser === 'firefox') {
        return `--kiosk ${url}`;
    }
    return '';
}

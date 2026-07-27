/**
 * Resolves local media URLs.
 * (Kept name for backward compatibility during migration)
 */
export function optimizeCloudinaryUrl(url, options = {}) {
    if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined') {
        return '/person.png';
    }

    let cleanUrl = url;
    
    // Strip localhost:PORT completely if we are on a live server/different host
    if (cleanUrl.includes('localhost:') && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
        const portMatch = cleanUrl.match(/localhost:\d+/);
        if (portMatch) {
            const hostString = portMatch[0];
            const index = cleanUrl.indexOf(hostString);
            if (index !== -1) {
                cleanUrl = cleanUrl.substring(index + hostString.length);
            }
        } else {
            const apiUploadIndex = cleanUrl.indexOf('/api/uploads/');
            if (apiUploadIndex !== -1) {
                cleanUrl = cleanUrl.substring(apiUploadIndex);
            } else {
                const uploadIndex = cleanUrl.indexOf('/uploads/');
                if (uploadIndex !== -1) {
                    cleanUrl = cleanUrl.substring(uploadIndex);
                }
            }
        }
    }

    // Resolve absolute path from Vite env
    let API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    if (API_BASE.includes('localhost') && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
        API_BASE = API_BASE.replace('localhost', window.location.hostname);
    }
    const baseUrl = API_BASE.replace(/\/api$/, '');

    if (cleanUrl.startsWith('/api/uploads/')) {
        return `${baseUrl}${cleanUrl}`;
    } else if (cleanUrl.startsWith('/uploads/')) {
        return `${baseUrl}/api${cleanUrl}`;
    }
    
    // Check if it's already an absolute HTTP URL pointing to our domain or external
    if (cleanUrl.startsWith('http')) {
        return cleanUrl;
    }
    
    // Ensure it starts with /
    const prefix = cleanUrl.startsWith('/') ? '' : '/';
    return `${baseUrl}${prefix}${cleanUrl}`;
}


export function getThumbnailUrl(url) {
    return optimizeCloudinaryUrl(url);
}

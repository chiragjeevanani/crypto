/**
 * Resolves local media URLs.
 * (Kept name for backward compatibility during migration)
 */
export function optimizeCloudinaryUrl(url, options = {}) {
    if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined') {
        return '/person.png';
    }

    let cleanUrl = url;
    
    // If the backend accidentally attached localhost but we are on a live server, strip it.
    if (cleanUrl.includes('localhost:') && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
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

    // Resolve absolute path from Vite env
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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

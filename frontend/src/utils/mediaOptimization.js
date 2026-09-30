/**
 * Resolves local media URLs.
 * (Kept name for backward compatibility during migration)
 */
export function optimizeCloudinaryUrl(url, options = {}) {
    if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined') {
        return '/person.png';
    }

    let cleanUrl = url;
    
    // Fix typos in Cloudinary domain
    if (cleanUrl.includes('es.cloudinary.com')) {
        cleanUrl = cleanUrl.replace('es.cloudinary.com', 'res.cloudinary.com');
    }
    
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

    // Check if it's already an absolute HTTP URL (after domain fix)
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('blob:') || cleanUrl.startsWith('data:')) {
        return cleanUrl;
    }

    // Ensure leading slash for relative paths
    if (!cleanUrl.startsWith('/')) {
        cleanUrl = '/' + cleanUrl;
    }

    // Resolve absolute path from Vite env
    let API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    if (API_BASE.includes('localhost') && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
        API_BASE = API_BASE.replace('localhost', window.location.hostname);
    }
    const baseUrl = API_BASE.replace(/\/api\/?$/, '');

    if (cleanUrl.startsWith('/api/uploads/')) {
        return `${baseUrl}${cleanUrl}`;
    } else if (cleanUrl.startsWith('/uploads/')) {
        return `${baseUrl}/api${cleanUrl}`;
    }
    
    return `${baseUrl}${cleanUrl}`;
}


export function getThumbnailUrl(url) {
    return optimizeCloudinaryUrl(url);
}

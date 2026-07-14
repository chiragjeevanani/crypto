/**
 * Optimizes Cloudinary URLs for better performance and data saving.
 * Adds auto format, auto quality, and width capping.
 */
export function optimizeCloudinaryUrl(url, options = {}) {
    if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined') {
        return '/person.png';
    }

    if (!url.includes('cloudinary.com')) {
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

        if (cleanUrl.startsWith('/api/uploads/')) {
            const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
            const baseUrl = API_BASE.replace(/\/api$/, '');
            return `${baseUrl}${cleanUrl}`;
        } else if (cleanUrl.startsWith('/uploads/')) {
            const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
            const baseUrl = API_BASE.replace(/\/api$/, '');
            return `${baseUrl}/api${cleanUrl}`;
        }
        return cleanUrl;
    }

    const { width = 1080, quality = 'auto', format = 'auto', isVideo = false } = options;

    // Detect if this is a thumbnail of a video (ends in image extension but might be in /video/ path)
    const isImageFormat = /\.(jpg|jpeg|png|webp|avif|heic)$/i.test(url);
    const effectiveIsVideo = isVideo && !isImageFormat;

    // Split at /upload/ - handle both /image/upload, /video/upload or just /upload
    const uploadMarker = '/upload/';
    const markerIndex = url.indexOf(uploadMarker);
    if (markerIndex === -1) return url;

    const prefix = url.substring(0, markerIndex + uploadMarker.length);
    const remainder = url.substring(markerIndex + uploadMarker.length);

    // If the remainder already contains transformations (e.g. w_200/), skip optimization or handle carefully
    // For simplicity, if it already has transformations, we'll just return the original URL to avoid breaking it
    if (remainder.includes('/') && !remainder.startsWith('v') && !remainder.startsWith('crypto-app/')) {
        return url;
    }

    // Common transformation parts
    const transformations = [
        `q_${quality}`,
        `f_${format}`,
        `w_${width}`,
        'c_limit' // Maintain aspect ratio but don't upscale
    ];

    if (effectiveIsVideo) {
        // Skip optimizing videos to prevent playback/CORS issues on older formats
        return url;
    }

    // Clean up: join with comma and remove any leading/trailing slashes to avoid double slashes
    const transformationString = transformations.filter(Boolean).join(',');
    const cleanRemainder = remainder.startsWith('/') ? remainder.substring(1) : remainder;

    return `${prefix}${transformationString}/${cleanRemainder}`;
}


export function getThumbnailUrl(url) {
    return optimizeCloudinaryUrl(url, { width: 400, quality: '50' });
}

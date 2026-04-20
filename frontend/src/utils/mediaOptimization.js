/**
 * Optimizes Cloudinary URLs for better performance and data saving.
 * Adds auto format, auto quality, and width capping.
 */
export function optimizeCloudinaryUrl(url, options = {}) {
    if (!url || typeof url !== 'string') {
        return '/person.png';
    }

    if (!url.includes('cloudinary.com')) {
        return url;
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
        // Remove f_auto for videos to avoid 416 Range Not Satisfiable errors
        const fIdx = transformations.findIndex(t => t.startsWith('f_'));
        if (fIdx !== -1) transformations.splice(fIdx, 1);
        
        if (width > 720) {
            const idx = transformations.findIndex(t => t.startsWith('w_'));
            if (idx !== -1) transformations[idx] = 'w_720';
        }
    }

    // Clean up: join with comma and remove any leading/trailing slashes to avoid double slashes
    const transformationString = transformations.filter(Boolean).join(',');
    const cleanRemainder = remainder.startsWith('/') ? remainder.substring(1) : remainder;

    return `${prefix}${transformationString}/${cleanRemainder}`;
}


export function getThumbnailUrl(url) {
    return optimizeCloudinaryUrl(url, { width: 400, quality: '50' });
}

/**
 * Optimizes Cloudinary URLs for better performance and data saving.
 * Adds auto format, auto quality, and width capping.
 */
export function optimizeCloudinaryUrl(url, options = {}) {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
        return url;
    }

    const { width = 1080, quality = 'auto', format = 'auto', isVideo = false } = options;

    // Split at /upload/
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    // Common transformation parts
    const transformations = [
        `q_${quality}`,
        `f_${format}`,
        `w_${width}`,
        'c_limit' // Maintain aspect ratio but don't upscale
    ];

    if (isVideo) {
        // Remove f_auto for videos to avoid 416 Range Not Satisfiable errors with partial content requests
        const fIdx = transformations.findIndex(t => t.startsWith('f_'));
        if (fIdx !== -1) transformations.splice(fIdx, 1);
        
        transformations.push('vc_auto'); 
        if (width > 720) {
            const idx = transformations.findIndex(t => t.startsWith('w_'));
            if (idx !== -1) transformations[idx] = 'w_720';
        }
    } else {
        // Image specific optimizations
        transformations.push('dpr_auto');
    }

    return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
}

export function getThumbnailUrl(url) {
    return optimizeCloudinaryUrl(url, { width: 400, quality: '50' });
}

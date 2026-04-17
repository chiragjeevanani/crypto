import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { optimizeCloudinaryUrl } from '../../../../utils/mediaOptimization';

export const NO_IMAGE_AVATAR = '/person.png';

export default function Avatar({ src, alt = 'user', className = '', size = 'md', isPremium = false, ...props }) {
    const [imgSrc, setImgSrc] = useState(NO_IMAGE_AVATAR);
    const [hasAttemptedRaw, setHasAttemptedRaw] = useState(false);

    const sizeClasses = {
        'xs': 'w-6 h-6',
        'sm': 'w-8 h-8',
        'md': 'w-10 h-10',
        'lg': 'w-14 h-14',
        'xl': 'w-20 h-20',
        '2xl': 'w-32 h-32'
    };

    useEffect(() => {
        // Initially try the optimized version
        if (src) {
            setImgSrc(optimizeCloudinaryUrl(src, { width: 200, quality: '80' }));
            setHasAttemptedRaw(false);
        } else {
            setImgSrc(NO_IMAGE_AVATAR);
        }
    }, [src]);

    const handleError = (e) => {
        if (!hasAttemptedRaw && src && src.includes('cloudinary.com')) {
            // If optimization failed (e.g. 401), try the raw URL
            setImgSrc(src);
            setHasAttemptedRaw(true);
        } else if (imgSrc !== NO_IMAGE_AVATAR) {
            // Already tried raw, or or not a cloudinary URL, go to placeholder
            setImgSrc(NO_IMAGE_AVATAR);
            e.target.classList.add('opacity-60');
        }
    };

    return (
        <div className={`relative flex-shrink-0 ${className}`}>
            <div className={`${sizeClasses[size] || size} rounded-full overflow-hidden bg-surface2/30`}>
                <img 
                    src={imgSrc} 
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-200 ${imgSrc === NO_IMAGE_AVATAR ? 'opacity-60' : ''}`}
                    onError={handleError}
                    {...props}
                />
            </div>
            {isPremium && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-orange-500 rounded-full flex items-center justify-center p-0.5 shadow-sm border border-surface z-10 animate-in fade-in zoom-in duration-300">
                    <Check size={size === 'xs' ? 6 : size === 'sm' ? 7 : 8} className="text-white" strokeWidth={5} />
                </div>
            )}
        </div>
    );
}
